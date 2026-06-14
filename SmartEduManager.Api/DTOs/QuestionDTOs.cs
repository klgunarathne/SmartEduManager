using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartEduManager.Api.DTOs;

public class QuestionDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "multiple-choice";
    public string Difficulty { get; set; } = "medium";
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int Marks { get; set; }
    public string[]? Options { get; set; }
    public string? CorrectAnswer { get; set; }
    public string? Explanation { get; set; }
    public string[] Tags { get; set; } = [];
    public string CreatedAt { get; set; } = string.Empty;
    public string UpdatedAt { get; set; } = string.Empty;
}

public class CreateQuestionDto
{
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "multiple-choice";
    public string Difficulty { get; set; } = "medium";
    public int CategoryId { get; set; }
    public int Marks { get; set; } = 1;
    public string[]? Options { get; set; }
    public string? CorrectAnswer { get; set; }
    public string? Explanation { get; set; }
    public string? Tags { get; set; }
}

public class UpdateQuestionDto
{
    public string Content { get; set; } = string.Empty;
    public string Type { get; set; } = "multiple-choice";
    public string Difficulty { get; set; } = "medium";
    public int CategoryId { get; set; }
    public int Marks { get; set; } = 1;
    public string[]? Options { get; set; }
    public string? CorrectAnswer { get; set; }
    public string? Explanation { get; set; }
    public string? Tags { get; set; }
}