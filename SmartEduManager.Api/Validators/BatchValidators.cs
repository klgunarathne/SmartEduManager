using FluentValidation;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Validators;

public class CreateBatchDtoValidator : AbstractValidator<CreateBatchDto>
{
    public CreateBatchDtoValidator()
    {
        RuleFor(x => x.BatchCode)
            .NotEmpty().WithMessage("Batch code is required")
            .MaximumLength(50).WithMessage("Batch code must be less than 50 characters");

        RuleFor(x => x.CourseId)
            .NotEmpty().WithMessage("Course is required")
            .GreaterThan(0).WithMessage("Course ID must be greater than 0");

        RuleFor(x => x.StartDate)
            .NotEmpty().WithMessage("Start date is required");

        RuleFor(x => x.EndDate)
            .NotEmpty().WithMessage("End date is required")
            .GreaterThan(x => x.StartDate).WithMessage("End date must be after start date");

        RuleFor(x => x.Duration)
            .NotEmpty().WithMessage("Duration is required")
            .GreaterThan(0).WithMessage("Duration must be greater than 0");
    }
}

public class UpdateBatchDtoValidator : AbstractValidator<UpdateBatchDto>
{
    public UpdateBatchDtoValidator()
    {
        RuleFor(x => x.BatchCode)
            .MaximumLength(50).WithMessage("Batch code must be less than 50 characters")
            .When(x => !string.IsNullOrEmpty(x.BatchCode));

        RuleFor(x => x.CourseId)
            .GreaterThan(0).WithMessage("Course ID must be greater than 0")
            .When(x => x.CourseId.HasValue);



        RuleFor(x => x.EndDate)
            .GreaterThan(x => x.StartDate).WithMessage("End date must be after start date")
            .When(x => x.EndDate.HasValue && x.StartDate.HasValue);

        RuleFor(x => x.Duration)
            .GreaterThan(0).WithMessage("Duration must be greater than 0")
            .When(x => x.Duration.HasValue);
    }
}
