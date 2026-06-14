using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    // Add your DbSets for other entities here
     public DbSet<District> Districts { get; set; } = null!;
     public DbSet<Center> Centers { get; set; } = null!;
     public DbSet<Course> Courses { get; set; } = null!;
     public DbSet<Instructor> Instructors { get; set; } = null!;
     public DbSet<CourseInstructor> CourseInstructors { get; set; } = null!;
     public DbSet<Batch> Batches { get; set; } = null!;
     public DbSet<Student> Students { get; set; } = null!;
     public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
      public DbSet<NCS> NCS { get; set; } = null!;
      public DbSet<Modules> Modules { get; set; } = null!;
      public DbSet<ModuleTask> ModuleTasks { get; set; } = null!;
      public DbSet<ContinuousAssessment> ContinuousAssessments { get; set; } = null!;
public DbSet<Assignment> Assignments { get; set; } = null!;
       public DbSet<AssignmentMarks> AssignmentMarks { get; set; } = null!;
       public DbSet<QuestionCategory> QuestionCategories { get; set; } = null!;
       public DbSet<Question> Questions { get; set; } = null!;
       public DbSet<Exam> Exams { get; set; } = null!;
       public DbSet<ExamQuestion> ExamQuestions { get; set; } = null!;

     protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Attendance>().ToTable("Attendances");

        builder.Entity<RefreshToken>()
            .HasOne<ApplicationUser>()
            .WithMany()
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<RefreshToken>()
            .HasIndex(t => t.Token)
            .IsUnique();

        // Configure relationships
        builder.Entity<Center>()
            .HasOne(c => c.District)
            .WithMany(d => d.Centers)
            .HasForeignKey(c => c.DistrictId);

        builder.Entity<Course>()
            .HasOne(c => c.Center)
            .WithMany(ce => ce.Courses)
            .HasForeignKey(c => c.CenterId);

        // Configure decimal property precision and scale
        builder.Entity<Course>()
            .Property(c => c.CourseFee)
            .HasPrecision(18, 2);

        builder.Entity<CourseInstructor>()
            .HasKey(ci => new { ci.CourseId, ci.InstructorId });

        builder.Entity<CourseInstructor>()
            .HasOne(ci => ci.Course)
            .WithMany(c => c.CourseInstructors)
            .HasForeignKey(ci => ci.CourseId);

        builder.Entity<CourseInstructor>()
            .HasOne(ci => ci.Instructor)
            .WithMany(i => i.CourseInstructors)
            .HasForeignKey(ci => ci.InstructorId);

        builder.Entity<Batch>()
            .HasOne(b => b.Course)
            .WithMany(c => c.Batches)
            .HasForeignKey(b => b.CourseId);

        builder.Entity<Student>()
            .HasOne(s => s.Batch)
            .WithMany(b => b.Students)
            .HasForeignKey(s => s.BatchId);

        // NCS relationships
        builder.Entity<NCS>()
            .HasOne(n => n.Course)
            .WithMany(c => c.NCS)
            .HasForeignKey(n => n.CourseId);

        builder.Entity<NCS>()
            .HasMany(n => n.Modules)
            .WithOne(m => m.NCS)
            .HasForeignKey(m => m.NCSId);

        // Modules relationships
        builder.Entity<Modules>()
            .HasMany(m => m.Tasks)
            .WithOne(t => t.Module)
            .HasForeignKey(t => t.ModuleId);

// Continuous Assessment relationships
        builder.Entity<ContinuousAssessment>()
            .HasOne(ca => ca.Student)
            .WithMany()
            .HasForeignKey(ca => ca.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ContinuousAssessment>()
            .HasOne(ca => ca.ModuleTask)
            .WithMany()
            .HasForeignKey(ca => ca.ModuleTaskId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ContinuousAssessment>()
            .HasIndex(ca => new { ca.StudentId, ca.ModuleTaskId })
            .IsUnique();

        // Assignment relationships
        builder.Entity<Assignment>()
            .HasMany(a => a.AssignmentMarks)
            .WithOne(am => am.Assignment)
            .HasForeignKey(am => am.AssignmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // AssignmentMarks relationships
        builder.Entity<AssignmentMarks>()
            .HasOne(am => am.Student)
            .WithMany()
            .HasForeignKey(am => am.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        // Composite unique key to prevent duplicate assignment marks
        builder.Entity<AssignmentMarks>()
            .HasIndex(am => new { am.AssignmentId, am.StudentId })
            .IsUnique();

        // Attendance relationships
        builder.Entity<Attendance>()
            .HasOne(a => a.Student)
            .WithMany()
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Attendance>()
            .HasOne(a => a.Batch)
            .WithMany()
            .HasForeignKey(a => a.BatchId)
            .OnDelete(DeleteBehavior.Cascade);

// Composite unique key to prevent duplicate attendance for same student on same date
         builder.Entity<Attendance>()
             .HasIndex(a => new { a.StudentId, a.Date })
             .IsUnique();

         // Question relationships
         builder.Entity<Question>()
             .HasOne(q => q.Category)
             .WithMany(c => c.Questions)
             .HasForeignKey(q => q.CategoryId)
             .OnDelete(DeleteBehavior.Cascade);

         // Exam relationships
         builder.Entity<Exam>()
             .HasOne(e => e.Category)
             .WithMany(c => c.Exams)
             .HasForeignKey(e => e.CategoryId)
             .OnDelete(DeleteBehavior.Cascade);

         // ExamQuestion relationships
         builder.Entity<ExamQuestion>()
             .HasOne(eq => eq.Exam)
             .WithMany(e => e.ExamQuestions)
             .HasForeignKey(eq => eq.ExamId)
             .OnDelete(DeleteBehavior.Cascade);

         builder.Entity<ExamQuestion>()
             .HasOne(eq => eq.Question)
             .WithMany(q => q.ExamQuestions)
             .HasForeignKey(eq => eq.QuestionId)
             .OnDelete(DeleteBehavior.Restrict);
     }
 }