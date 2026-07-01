using System;
using System.Collections.Generic;

namespace SmartEduManager.Api.DTOs
{
    public class SessionItemDto
    {
        public int ItemId { get; set; }
        public int AppointmentId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ItemType { get; set; } = "Task";
        public bool IsCompleted { get; set; }
        public DateTime? DueDateTime { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CourseSessionDto
    {
        public int AppointmentId { get; set; }
        public string Text { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public bool AllDay { get; set; }
        public string? RecurrenceRule { get; set; }
        public string? RecurrenceException { get; set; }
        public string? SessionType { get; set; }
        public string? Status { get; set; }
        public bool IsPublished { get; set; }
        public string? Color { get; set; }
        public int? CourseId { get; set; }
        public string? CourseName { get; set; }
        public int? BatchId { get; set; }
        public string? BatchCode { get; set; }
        public int? InstructorId { get; set; }
        public string? InstructorName { get; set; }
        public int? CenterId { get; set; }
        public string? CenterName { get; set; }
        public int? ModuleId { get; set; }
        public string? ModuleName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public List<SessionItemDto> Items { get; set; } = new();
    }

    public class CreateCourseSessionDto
    {
        [Required]
        [MaxLength(200)]
        public string Text { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        public DateTime StartDateTime { get; set; }

        [Required]
        public DateTime EndDateTime { get; set; }

        public bool AllDay { get; set; } = false;

        public string? RecurrenceRule { get; set; }

        public string? RecurrenceException { get; set; }

        [MaxLength(50)]
        public string? SessionType { get; set; } = "Theory";

        [MaxLength(50)]
        public string? Status { get; set; } = "Scheduled";

        public bool IsPublished { get; set; } = false;

        [MaxLength(20)]
        public string? Color { get; set; }

        public int? CourseId { get; set; }

        [Required]
        public int BatchId { get; set; }

        public int? InstructorId { get; set; }

        public int? CenterId { get; set; }

        public int? ModuleId { get; set; }

        public List<CreateSessionItemDto>? Items { get; set; }
    }

    public class UpdateCourseSessionDto
    {
        [MaxLength(200)]
        public string? Text { get; set; }

        public string? Description { get; set; }

        public DateTime? StartDateTime { get; set; }

        public DateTime? EndDateTime { get; set; }

        public bool? AllDay { get; set; }

        public string? RecurrenceRule { get; set; }

        public string? RecurrenceException { get; set; }

        [MaxLength(50)]
        public string? SessionType { get; set; }

        [MaxLength(50)]
        public string? Status { get; set; }

        public bool? IsPublished { get; set; }

        [MaxLength(20)]
        public string? Color { get; set; }

        public int? CourseId { get; set; }

        public int? BatchId { get; set; }

        public int? InstructorId { get; set; }

        public int? CenterId { get; set; }

        public int? ModuleId { get; set; }

        public List<CreateSessionItemDto>? Items { get; set; }
    }

    public class CreateSessionItemDto
    {
        [Required]
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Description { get; set; }

        [Required]
        [MaxLength(50)]
        public string ItemType { get; set; } = "Task";

        public bool IsCompleted { get; set; } = false;

        public DateTime? DueDateTime { get; set; }
    }

    public class ConflictCheckRequestDto
    {
        public int BatchId { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public int? InstructorId { get; set; }
        public int? CenterId { get; set; }
        public int? ExcludeAppointmentId { get; set; }
    }

    public class ConflictCheckResultDto
    {
        public bool HasConflict { get; set; }
        public List<ConflictDto> Conflicts { get; set; } = new();
    }

    public class ConflictDto
    {
        public int AppointmentId { get; set; }
        public string Text { get; set; } = string.Empty;
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
        public string ConflictType { get; set; } = string.Empty;
    }

    public class GenerateTimetableRequestDto
    {
        [Required]
        public int BatchId { get; set; }

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public List<int> ExcludedDays { get; set; } = new() { 0, 6 };

        public List<GenerateTimetableModuleDto> Modules { get; set; } = new();

        public int? InstructorId { get; set; }

        public int? CenterId { get; set; }
    }

    public class GenerateTimetableModuleDto
    {
        public int ModuleId { get; set; }
        public string ModuleName { get; set; } = string.Empty;
        public int TheoryHours { get; set; }
        public int PracticalHours { get; set; }
        public int SessionDurationMinutes { get; set; } = 120;
    }

    public class TimetableQueryParams
    {
        public int? BatchId { get; set; }
        public DateTime? Start { get; set; }
        public DateTime? End { get; set; }
    }
}
