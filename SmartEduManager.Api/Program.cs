using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Serilog;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Helpers;
using SmartEduManager.Api.Middleware;
using SmartEduManager.Api.Models;
using SmartEduManager.Api.Profiles;
using SmartEduManager.Api.Repositories;
using SmartEduManager.Api.Repositories.Interfaces;
using SmartEduManager.Api.Validators;
using Swashbuckle.AspNetCore.SwaggerGen;
using System.Reflection;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File("logs/SmartEduManager-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container.
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase; // Use camelCase for JSON serialization
});

// Configure EF Core and Identity
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// Configure JWT Authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
})
 .AddJwtBearer(options =>
 {
     options.SaveToken = true;
     options.RequireHttpsMetadata = builder.Environment.IsDevelopment() ? false : true;
     options.TokenValidationParameters = new TokenValidationParameters()
     {
         ValidateIssuer = true,
         ValidateAudience = true,
         ValidAudience = builder.Configuration["Jwt:Audience"],
         ValidIssuer = builder.Configuration["Jwt:Issuer"],
         IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
         ValidateIssuerSigningKey = true,
         ValidateLifetime = true,
         ClockSkew = TimeSpan.Zero
     };
 });

// Configure Repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IDistrictRepository, DistrictRepository>();
builder.Services.AddScoped<ICenterRepository, CenterRepository>();
builder.Services.AddScoped<ICourseRepository, CourseRepository>();
builder.Services.AddScoped<IInstructorRepository, InstructorRepository>();
builder.Services.AddScoped<ICourseInstructorRepository, CourseInstructorRepository>();
    builder.Services.AddScoped<IBatchRepository, BatchRepository>();
    builder.Services.AddScoped<IStudentRepository, StudentRepository>();
    builder.Services.AddScoped<INCSRepository, NCSRepository>();
    builder.Services.AddScoped<IModulesRepository, ModulesRepository>();
    builder.Services.AddScoped<IModuleTaskRepository, ModuleTaskRepository>();
    builder.Services.AddScoped<IContinuousAssessmentRepository, ContinuousAssessmentRepository>();
    builder.Services.AddScoped<IAssignmentRepository, AssignmentRepository>();
    builder.Services.AddScoped<IAssignmentMarksRepository, AssignmentMarksRepository>();
    builder.Services.AddScoped<IAttendanceRepository, AttendanceRepository>();

// Configure AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Configure FluentValidation
builder.Services.AddFluentValidationAutoValidation()
    .AddFluentValidationClientsideAdapters();
builder.Services.AddValidatorsFromAssemblyContaining<RegisterDtoValidator>();

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SmartEduManager API",
        Version = "v1",
        Description = "API for managing educational data"
    });

    // Configure JWT authentication for Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and then your token in the text input below.\n\nExample: 'Bearer 1safsfsdfdfd'"
    });

    options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
    {
        { new OpenApiSecuritySchemeReference("Bearer"), new List<string>() }
    });

    // Include XML comments if available
    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

 // Configure CORS
 builder.Services.AddCors(options =>
 {
     options.AddPolicy("AllowAllOrigins",
         policy =>
         {
             policy.WithOrigins(
                     "http://localhost:4200",
                     "https://localhost:4200",
                     "http://localhost:4201",
                     "https://localhost:4201",
                     "http://localhost:5000",
                     "https://localhost:5000",
                     "http://localhost:5001",
                     "https://localhost:5001",
                     "http://localhost:5173",
                     "https://localhost:5173",
                     "http://localhost:3000",
                     "https://localhost:3001"
                 )
                 .AllowAnyMethod()
                 .AllowAnyHeader()
                 .AllowCredentials();
         });
 });

builder.Services.AddScoped<ImageUploadHelper>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "SmartEduManager API v1");
        options.RoutePrefix = "swagger"; // To serve Swagger UI at /swagger instead of root
    });
}

app.UseHttpsRedirection();

// Enable static file serving
app.UseStaticFiles();

// Configure Serilog request logging
app.UseSerilogRequestLogging();

// Enable CORS
app.UseCors("AllowAllOrigins");

// Custom error handling
app.UseErrorHandling();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Initialize database and seed roles
await Seeder.SeedDatabaseAsync(app);

app.Run();
