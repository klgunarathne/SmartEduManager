using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartEduManager.Api.Models
{
    public enum ExamStatus
    {
        Draft,
        Scheduled,
        Active,
        Completed
    }

    public class Exam
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int Duration { get; set; } // in minutes
        public ExamStatus Status { get; set; } = ExamStatus.Draft;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ScheduledAt { get; set; }
        public DateTime? PublishedAt { get; set; }
        public DateTime? AvailableFrom { get; set; }
        public DateTime? AvailableTo { get; set; }
        public string? TimeZone { get; set; }

        // Navigation properties
        public int? CategoryId { get; set; }
        public QuestionCategory? Category { get; set; }
        
        public ICollection<ExamQuestion> ExamQuestions { get; set; } = [];
    }
}