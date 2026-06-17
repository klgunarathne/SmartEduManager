using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartEduManager.Api.Models
{
    public class ExamAttempt
    {
        public int Id { get; set; }
        public int ExamId { get; set; }
        public string StudentId { get; set; } = string.Empty;
        public DateTime StartedAt { get; set; } = DateTime.UtcNow;
        public DateTime? SubmittedAt { get; set; }
        public int Score { get; set; }
        public int TotalMarks { get; set; }
        public bool IsCompleted { get; set; }
        public string Status { get; set; } = "InProgress";

        public Exam? Exam { get; set; }
        public ICollection<ExamAnswer> Answers { get; set; } = [];
    }

    public class ExamAnswer
    {
        public int Id { get; set; }
        public int ExamAttemptId { get; set; }
        public int QuestionId { get; set; }
        public string? SelectedAnswer { get; set; }
        public bool IsCorrect { get; set; }
        public int MarksObtained { get; set; }

        public ExamAttempt? ExamAttempt { get; set; }
    }
}
