using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.Models;
using System;

namespace SmartEduManager.Api.Data;

public static class Seeder
{
    public static async Task SeedDatabaseAsync(WebApplication app)
    {
        using (var scope = app.Services.CreateScope())
        {
            var services = scope.ServiceProvider;
            try
            {
                var context = services.GetRequiredService<AppDbContext>();
                var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();
                var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

                // Ensure database is created
                context.Database.EnsureCreated();

                // Seed roles
                var roles = new[] { "Admin", "Instructor", "User" };
                foreach (var role in roles)
                {
                    if (!await roleManager.RoleExistsAsync(role))
                    {
                        await roleManager.CreateAsync(new IdentityRole(role));
                    }
                }

                // Seed admin user
                var adminEmail = "admin@smartedumanager.com";
                var adminUser = await userManager.FindByEmailAsync(adminEmail);
                if (adminUser == null)
                {
                    var user = new ApplicationUser
                    {
                        FirstName = "Admin",
                        LastName = "User",
                        UserName = adminEmail,
                        Email = adminEmail,
                        EmailConfirmed = true,
                        Address = "Administrator Office",
                        DateOfBirth = new DateTime(1980, 1, 1)
                    };

                    var result = await userManager.CreateAsync(user, "Admin@123");
                    if (result.Succeeded)
                    {
                        await userManager.AddToRoleAsync(user, "Admin");
                    }
                }

                // Seed districts
                if (!context.Districts.Any())
                {
                    var districts = new[]
                    {
                        new District { DistrictName = "Colombo" },
                        new District { DistrictName = "Gampaha" },
                        new District { DistrictName = "Kalutara" },
                        new District { DistrictName = "Kandy" },
                        new District { DistrictName = "Matale" }
                    };
                    await context.Districts.AddRangeAsync(districts);
                    await context.SaveChangesAsync();
                }

                // Seed centers
                if (!context.Centers.Any())
                {
                    var districts = await context.Districts.ToListAsync();
                    var centers = new[]
                    {
                        new Center { CenterName = "Colombo Main Center", Address = "123 Galle Road, Colombo 03", ContactNumber = "0112345678", DistrictId = districts[0].DistrictId },
                        new Center { CenterName = "Gampaha Center", Address = "456 Main Street, Gampaha", ContactNumber = "0332245678", DistrictId = districts[1].DistrictId },
                        new Center { CenterName = "Kandy Center", Address = "789 Peradeniya Road, Kandy", ContactNumber = "0812245678", DistrictId = districts[3].DistrictId }
                    };
                    await context.Centers.AddRangeAsync(centers);
                    await context.SaveChangesAsync();
                }

                // Seed courses
                if (!context.Courses.Any())
                {
                    var centers = await context.Centers.ToListAsync();
                    var courses = new[]
                    {
                        new Course { CourseName = "Web Development", Description = "Full stack web development using HTML, CSS, JavaScript, and React", Duration = 6, CourseFee = 50000, CenterId = centers[0].CenterId },
                        new Course { CourseName = "Mobile App Development", Description = "Native mobile app development for Android and iOS", Duration = 8, CourseFee = 65000, CenterId = centers[0].CenterId },
                        new Course { CourseName = "Data Science", Description = "Data analysis and machine learning using Python", Duration = 12, CourseFee = 80000, CenterId = centers[1].CenterId },
                        new Course { CourseName = "Digital Marketing", Description = "Social media marketing, SEO, and content creation", Duration = 4, CourseFee = 35000, CenterId = centers[2].CenterId }
                    };
                    await context.Courses.AddRangeAsync(courses);
                    await context.SaveChangesAsync();
                }

                // Seed instructors
                if (!context.Instructors.Any())
                {
                    var instructors = new[]
                    {
                        new Instructor { FullName = "John Doe", Email = "john@smartedumanager.com", Phone = "0712345678", NIC = "123456789V", EPFNo = "EPF12345" },
                        new Instructor { FullName = "Jane Smith", Email = "jane@smartedumanager.com", Phone = "0722345678", NIC = "987654321V", EPFNo = "EPF67890" },
                        new Instructor { FullName = "Mike Johnson", Email = "mike@smartedumanager.com", Phone = "0772345678", NIC = "456789123V", EPFNo = "EPF54321" }
                    };
                    await context.Instructors.AddRangeAsync(instructors);
                    await context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                var logger = services.GetRequiredService<ILogger<Program>>();
                logger.LogError(ex, "An error occurred while seeding the database.");
            }
        }
    }
}
