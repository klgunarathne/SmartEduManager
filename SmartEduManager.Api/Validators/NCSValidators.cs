using FluentValidation;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Validators;

public class CreateNCSDtoValidator : AbstractValidator<CreateNCSDto>
{
    public CreateNCSDtoValidator()
    {
        RuleFor(x => x.Version)
            .NotEmpty().WithMessage("Version is required")
            .MaximumLength(50).WithMessage("Version must be less than 50 characters");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .MaximumLength(200).WithMessage("Name must be less than 200 characters");

        RuleFor(x => x.UpdatedDate)
            .NotEmpty().WithMessage("Updated date is required");

        RuleFor(x => x.CourseId)
            .NotEmpty().WithMessage("Course is required")
            .GreaterThan(0).WithMessage("Course ID must be greater than 0");
    }
}

public class UpdateNCSDtoValidator : AbstractValidator<UpdateNCSDto>
{
    public UpdateNCSDtoValidator()
    {
        RuleFor(x => x.Version)
            .MaximumLength(50).WithMessage("Version must be less than 50 characters")
            .When(x => !string.IsNullOrEmpty(x.Version));

        RuleFor(x => x.Name)
            .MaximumLength(200).WithMessage("Name must be less than 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Name));

        RuleFor(x => x.CourseId)
            .GreaterThan(0).WithMessage("Course ID must be greater than 0")
            .When(x => x.CourseId.HasValue);
    }
}
