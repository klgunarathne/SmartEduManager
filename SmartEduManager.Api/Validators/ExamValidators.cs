using FluentValidation;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Validators;

public class CreateExamDtoValidator : AbstractValidator<CreateExamDto>
{
    public CreateExamDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Exam title is required")
            .MaximumLength(200).WithMessage("Exam title must be less than 200 characters");

        RuleFor(x => x.Duration)
            .GreaterThan(0).WithMessage("Duration must be greater than 0 minutes")
            .LessThanOrEqualTo(480).WithMessage("Duration cannot exceed 480 minutes (8 hours)");

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Category ID must be greater than 0")
            .When(x => x.CategoryId.HasValue);
    }
}

public class UpdateExamDtoValidator : AbstractValidator<UpdateExamDto>
{
    public UpdateExamDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Exam title is required")
            .MaximumLength(200).WithMessage("Exam title must be less than 200 characters");

        RuleFor(x => x.Duration)
            .GreaterThan(0).WithMessage("Duration must be greater than 0 minutes")
            .LessThanOrEqualTo(480).WithMessage("Duration cannot exceed 480 minutes (8 hours)");

        RuleFor(x => x.CategoryId)
            .GreaterThan(0).WithMessage("Category ID must be greater than 0")
            .When(x => x.CategoryId.HasValue);
    }
}

public class ScheduleExamDtoValidator : AbstractValidator<ScheduleExamDto>
{
    public ScheduleExamDtoValidator()
    {
        RuleFor(x => x.AvailableFrom)
            .NotEmpty().WithMessage("Start date/time is required")
            .When(x => !string.IsNullOrEmpty(x.ScheduleType) && x.ScheduleType == "range");

        RuleFor(x => x.TimeZone)
            .NotEmpty().WithMessage("Time zone is required")
            .When(x => x.ScheduleType != "permanent");
    }
}