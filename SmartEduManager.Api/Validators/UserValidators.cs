using FluentValidation;
using SmartEduManager.Api.Controllers;

namespace SmartEduManager.Api.Validators;

public class CreateUserDtoValidator : AbstractValidator<CreateUserDto>
{
    public CreateUserDtoValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(50).WithMessage("First name must be less than 50 characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(50).WithMessage("Last name must be less than 50 characters");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Email is not valid")
            .MaximumLength(100).WithMessage("Email must be less than 100 characters");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .MinimumLength(12).WithMessage("Password must be at least 12 characters")
            .MaximumLength(100).WithMessage("Password must be less than 100 characters");

        RuleFor(x => x.Address)
            .MaximumLength(200).WithMessage("Address must be less than 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Address));

        RuleFor(x => x.ImageUrl)
            .MaximumLength(500).WithMessage("Image URL must be less than 500 characters")
            .When(x => !string.IsNullOrEmpty(x.ImageUrl));
    }
}

public class UpdateUserDtoValidator : AbstractValidator<UpdateUserDto>
{
    public UpdateUserDtoValidator()
    {
        RuleFor(x => x.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MaximumLength(50).WithMessage("First name must be less than 50 characters");

        RuleFor(x => x.LastName)
            .NotEmpty().WithMessage("Last name is required")
            .MaximumLength(50).WithMessage("Last name must be less than 50 characters");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .EmailAddress().WithMessage("Email is not valid")
            .MaximumLength(100).WithMessage("Email must be less than 100 characters");

        RuleFor(x => x.Address)
            .MaximumLength(200).WithMessage("Address must be less than 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Address));

        RuleFor(x => x.ImageUrl)
            .MaximumLength(500).WithMessage("Image URL must be less than 500 characters")
            .When(x => !string.IsNullOrEmpty(x.ImageUrl));

        RuleFor(x => x.Status)
            .Must(status => status is "Active" or "Inactive")
            .WithMessage("Status must be Active or Inactive");
    }
}
