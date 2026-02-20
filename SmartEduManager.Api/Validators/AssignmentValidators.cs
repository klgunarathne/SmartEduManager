using FluentValidation;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Validators;

public class CreateAssignmentDtoValidator : AbstractValidator<CreateAssignmentDto>
{
    public CreateAssignmentDtoValidator()
    {
        RuleFor(x => x.AssignmentName)
            .NotEmpty().WithMessage("Assignment name is required")
            .MaximumLength(200).WithMessage("Assignment name must be less than 200 characters");
    }
}

public class UpdateAssignmentDtoValidator : AbstractValidator<UpdateAssignmentDto>
{
    public UpdateAssignmentDtoValidator()
    {
        RuleFor(x => x.AssignmentName)
            .NotEmpty().WithMessage("Assignment name is required")
            .MaximumLength(200).WithMessage("Assignment name must be less than 200 characters")
            .When(x => x.AssignmentName != null);
    }
}
