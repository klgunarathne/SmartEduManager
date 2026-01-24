using FluentValidation;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Validators;

public class CreateInstructorDtoValidator : AbstractValidator<CreateInstructorDto>
{
    public CreateInstructorDtoValidator()
    {
        RuleFor(x => x.EPFNo)
            .NotEmpty().WithMessage("EPF number is required")
            .MaximumLength(20).WithMessage("EPF number must be less than 20 characters");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required")
            .MaximumLength(100).WithMessage("Full name must be less than 100 characters");

        RuleFor(x => x.NIC)
            .NotEmpty().WithMessage("NIC is required")
            .MaximumLength(20).WithMessage("NIC must be less than 20 characters");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Email is not valid")
            .MaximumLength(100).WithMessage("Email must be less than 100 characters");

        RuleFor(x => x.Phone)
            .NotEmpty().WithMessage("Phone number is required")
            .MaximumLength(20).WithMessage("Phone number must be less than 20 characters");
    }
}

public class UpdateInstructorDtoValidator : AbstractValidator<UpdateInstructorDto>
{
    public UpdateInstructorDtoValidator()
    {
        RuleFor(x => x.EPFNo)
            .MaximumLength(20).WithMessage("EPF number must be less than 20 characters")
            .When(x => !string.IsNullOrEmpty(x.EPFNo));

        RuleFor(x => x.FullName)
            .MaximumLength(100).WithMessage("Full name must be less than 100 characters")
            .When(x => !string.IsNullOrEmpty(x.FullName));

        RuleFor(x => x.NIC)
            .MaximumLength(20).WithMessage("NIC must be less than 20 characters")
            .When(x => !string.IsNullOrEmpty(x.NIC));

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Email is not valid")
            .MaximumLength(100).WithMessage("Email must be less than 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.Phone)
            .MaximumLength(20).WithMessage("Phone number must be less than 20 characters")
            .When(x => !string.IsNullOrEmpty(x.Phone));
    }
}
