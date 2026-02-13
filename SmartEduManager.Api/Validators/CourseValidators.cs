using FluentValidation;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Validators;

public class CreateCourseDtoValidator : AbstractValidator<CreateCourseDto>
{
    public CreateCourseDtoValidator()
    {
        RuleFor(x => x.CourseName)
            .NotEmpty().WithMessage("Course name is required")
            .MaximumLength(100).WithMessage("Course name must be less than 100 characters");

        RuleFor(x => x.Description)
            .NotEmpty().WithMessage("Description is required")
            .MaximumLength(500).WithMessage("Description must be less than 500 characters");

        RuleFor(x => x.Duration)
            .NotEmpty().WithMessage("Duration is required")
            .GreaterThan(0).WithMessage("Duration must be greater than 0");

        RuleFor(x => x.CourseFee)
            .NotEmpty().WithMessage("Course fee is required")
            .GreaterThan(0).WithMessage("Course fee must be greater than 0");

        RuleFor(x => x.CenterId)
            .NotEmpty().WithMessage("Center is required")
            .GreaterThan(0).WithMessage("Center ID must be greater than 0");
    }
}

public class UpdateCourseDtoValidator : AbstractValidator<UpdateCourseDto>
{
    public UpdateCourseDtoValidator()
    {
        RuleFor(x => x.CourseName)
            .MaximumLength(100).WithMessage("Course name must be less than 100 characters")
            .When(x => !string.IsNullOrEmpty(x.CourseName));

        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must be less than 500 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Duration)
            .GreaterThan(0).WithMessage("Duration must be greater than 0")
            .When(x => x.Duration.HasValue);

        RuleFor(x => x.CourseFee)
            .GreaterThan(0).WithMessage("Course fee must be greater than 0")
            .When(x => x.CourseFee.HasValue);

        RuleFor(x => x.CenterId)
            .GreaterThan(0).WithMessage("Center ID must be greater than 0")
            .When(x => x.CenterId.HasValue);
    }
}
