using FluentValidation;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Validators;

public class CreateDistrictDtoValidator : AbstractValidator<CreateDistrictDto>
{
    public CreateDistrictDtoValidator()
    {
        RuleFor(x => x.DistrictName)
            .NotEmpty().WithMessage("District name is required")
            .MaximumLength(100).WithMessage("District name must be less than 100 characters");
    }
}

public class UpdateDistrictDtoValidator : AbstractValidator<UpdateDistrictDto>
{
    public UpdateDistrictDtoValidator()
    {
        RuleFor(x => x.DistrictName)
            .MaximumLength(100).WithMessage("District name must be less than 100 characters")
            .When(x => !string.IsNullOrEmpty(x.DistrictName));
    }
}
