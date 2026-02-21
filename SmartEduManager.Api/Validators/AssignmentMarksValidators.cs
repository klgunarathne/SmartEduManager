using FluentValidation;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Validators;

public class CreateAssignmentMarksDtoValidator : AbstractValidator<CreateAssignmentMarksDto>
{
    public CreateAssignmentMarksDtoValidator()
    {
        RuleFor(x => x.Marks)
            .NotEmpty().WithMessage("Marks are required")
            .GreaterThanOrEqualTo(0).WithMessage("Marks must be at least 0")
            .LessThanOrEqualTo(100).WithMessage("Marks must be at most 100");

        RuleFor(x => x.AssignmentDate)
            .NotEmpty().WithMessage("Assignment date is required")
            .LessThanOrEqualTo(DateTime.Now).WithMessage("Assignment date must be in the past");

        RuleFor(x => x.AssignmentId)
            .NotEmpty().WithMessage("Assignment ID is required")
            .GreaterThan(0).WithMessage("Assignment ID must be greater than 0");

        RuleFor(x => x.StudentId)
            .NotEmpty().WithMessage("Student ID is required")
            .GreaterThan(0).WithMessage("Student ID must be greater than 0");
    }
}

public class UpdateAssignmentMarksDtoValidator : AbstractValidator<UpdateAssignmentMarksDto>
{
    public UpdateAssignmentMarksDtoValidator()
    {
        RuleFor(x => x.Marks)
            .GreaterThanOrEqualTo(0).WithMessage("Marks must be at least 0")
            .LessThanOrEqualTo(100).WithMessage("Marks must be at most 100")
            .When(x => x.Marks >= 0);

        RuleFor(x => x.AssignmentDate)
            .LessThanOrEqualTo(DateTime.Now).WithMessage("Assignment date must be in the past")
            .When(x => x.AssignmentDate != null);
    }
}
