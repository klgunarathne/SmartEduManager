using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SmartEduManager.Api.DTOs;

public class QuestionCategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366f1";
    public int QuestionCount { get; set; }
}

public class CreateQuestionCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366f1";
}

public class UpdateQuestionCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#6366f1";
}