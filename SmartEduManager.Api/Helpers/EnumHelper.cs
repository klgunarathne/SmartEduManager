using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Helpers;

public static class EnumHelper
{
    public static QuestionType ParseQuestionType(string? type)
    {
        return Enum.TryParse<QuestionType>(type, true, out var result) ? result : QuestionType.MultipleChoice;
    }

    public static DifficultyLevel ParseDifficultyLevel(string? difficulty)
    {
        return Enum.TryParse<DifficultyLevel>(difficulty, true, out var result) ? result : DifficultyLevel.Medium;
    }
}
