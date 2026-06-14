using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartEduManager.Api.Models
{
    public enum QuestionType
    {
        MultipleChoice,
        TrueFalse,
        ShortAnswer,
        Essay
    }

    public enum DifficultyLevel
    {
        Easy,
        Medium,
        Hard
    }

    public class Question
    {
        public int Id { get; set; }
        public string Content { get; set; } = string.Empty;
        public QuestionType Type { get; set; }
        public DifficultyLevel Difficulty { get; set; }
        public int Marks { get; set; }
        public string? CorrectAnswer { get; set; }
        public string? Explanation { get; set; }
        public string[] Tags { get; set; } = [];
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public int CategoryId { get; set; }
        public QuestionCategory Category { get; set; } = null!;
        
        public ICollection<ExamQuestion> ExamQuestions { get; set; } = [];
    }
}