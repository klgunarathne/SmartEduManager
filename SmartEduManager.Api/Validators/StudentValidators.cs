using FluentValidation;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Validators;

public class CreateStudentDtoValidator : AbstractValidator<CreateStudentDto>
    {
        public CreateStudentDtoValidator()
        {
            RuleFor(x => x.MISNo)
                .NotEmpty().WithMessage("MIS number is required")
                .MaximumLength(50).WithMessage("MIS number must be less than 50 characters");

            RuleFor(x => x.NameWithInitials)
                .NotEmpty().WithMessage("Name with initials is required")
                .MaximumLength(100).WithMessage("Name with initials must be less than 100 characters");

            RuleFor(x => x.FullName)
                .NotEmpty().WithMessage("Full name is required")
                .MaximumLength(100).WithMessage("Full name must be less than 100 characters");

            RuleFor(x => x.NICNo)
                .MaximumLength(20).WithMessage("NIC must be less than 20 characters");

            RuleFor(x => x.Gender)
                .MaximumLength(10).WithMessage("Gender must be less than 10 characters");

            RuleFor(x => x.Address)
                .MaximumLength(200).WithMessage("Address must be less than 200 characters");

            RuleFor(x => x.Telephone)
                .MaximumLength(20).WithMessage("Telephone number must be less than 20 characters");

            RuleFor(x => x.Email)
                .EmailAddress().WithMessage("Email is not valid")
                .MaximumLength(100).WithMessage("Email must be less than 100 characters")
                .When(x => !string.IsNullOrEmpty(x.Email));

            RuleFor(x => x.BatchId)
                .NotEmpty().WithMessage("Batch is required")
                .GreaterThan(0).WithMessage("Batch ID must be greater than 0");

            RuleFor(x => x.GSDivision)
                .MaximumLength(100).WithMessage("GS Division must be less than 100 characters")
                .When(x => !string.IsNullOrEmpty(x.GSDivision));

            RuleFor(x => x.AGDivision)
                .MaximumLength(100).WithMessage("AG Division must be less than 100 characters")
                .When(x => !string.IsNullOrEmpty(x.AGDivision));
        }
    }

public class UpdateStudentDtoValidator : AbstractValidator<UpdateStudentDto>
{
    public UpdateStudentDtoValidator()
    {
        RuleFor(x => x.MISNo)
            .MaximumLength(50).WithMessage("MIS number must be less than 50 characters")
            .When(x => !string.IsNullOrEmpty(x.MISNo));

        RuleFor(x => x.NameWithInitials)
            .MaximumLength(100).WithMessage("Name with initials must be less than 100 characters")
            .When(x => !string.IsNullOrEmpty(x.NameWithInitials));

        RuleFor(x => x.FullName)
            .MaximumLength(100).WithMessage("Full name must be less than 100 characters")
            .When(x => !string.IsNullOrEmpty(x.FullName));

        RuleFor(x => x.NICNo)
            .MaximumLength(20).WithMessage("NIC must be less than 20 characters")
            .When(x => !string.IsNullOrEmpty(x.NICNo));

        RuleFor(x => x.Gender)
            .MaximumLength(10).WithMessage("Gender must be less than 10 characters")
            .When(x => !string.IsNullOrEmpty(x.Gender));

        RuleFor(x => x.Address)
            .MaximumLength(200).WithMessage("Address must be less than 200 characters")
            .When(x => !string.IsNullOrEmpty(x.Address));

        RuleFor(x => x.Telephone)
            .MaximumLength(20).WithMessage("Telephone number must be less than 20 characters")
            .When(x => !string.IsNullOrEmpty(x.Telephone));

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Email is not valid")
            .MaximumLength(100).WithMessage("Email must be less than 100 characters")
            .When(x => !string.IsNullOrEmpty(x.Email));

        RuleFor(x => x.BatchId)
            .GreaterThan(0).WithMessage("Batch ID must be greater than 0")
            .When(x => x.BatchId.HasValue);

        RuleFor(x => x.GSDivision)
            .MaximumLength(100).WithMessage("GS Division must be less than 100 characters")
            .When(x => !string.IsNullOrEmpty(x.GSDivision));

        RuleFor(x => x.AGDivision)
            .MaximumLength(100).WithMessage("AG Division must be less than 100 characters")
            .When(x => !string.IsNullOrEmpty(x.AGDivision));
    }
}
