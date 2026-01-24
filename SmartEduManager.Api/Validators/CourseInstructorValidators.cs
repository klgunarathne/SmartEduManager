using FluentValidation;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Validators;

public class CreateCourseInstructorDtoValidator : AbstractValidator<CreateCourseInstructorDto>
{
    public CreateCourseInstructorDtoValidator()
    {
        RuleFor(x => x.CourseId)
            .NotEmpty().WithMessage("Course is required")
            .GreaterThan(0).WithMessage("Course ID must be greater than 0");

        RuleFor(x => x.InstructorId)
            .NotEmpty().WithMessage("Instructor is required")
            .GreaterThan(0).WithMessage("Instructor ID must be greater than 0");
    }
}

public class UpdateCourseInstructorDtoValidator : AbstractValidator<UpdateCourseInstructorDto>
{
    public UpdateCourseInstructorDtoValidator()
    {
        RuleFor(x => x.CourseId)
            .GreaterThan(0).WithMessage("Course ID must be greater than 0")
            .When(x => x.CourseId.HasValue);

        RuleFor(x => x.InstructorId)
            .GreaterThan(0).WithMessage("Instructor ID must be greater than 0")
            .When(x => x.InstructorId.HasValue);
    }
}
