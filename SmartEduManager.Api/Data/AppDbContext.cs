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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

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
    }
}