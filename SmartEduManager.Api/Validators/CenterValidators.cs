using FluentValidation;
using SmartEduManager.Api.DTOs;

namespace SmartEduManager.Api.Validators;

public class CreateCenterDtoValidator : AbstractValidator<CreateCenterDto>
{
    public CreateCenterDtoValidator()
    {
        RuleFor(x => x.CenterName)
            .NotEmpty().WithMessage("Center name is required")
            .MaximumLength(100).WithMessage("Center name must be less than 100 characters");

        RuleFor(x => x.DistrictId)
            .NotEmpty().WithMessage("District is required")
            .GreaterThan(0).WithMessage("District ID must be greater than 0");
    }
}

public class UpdateCenterDtoValidator : AbstractValidator<UpdateCenterDto>
{
    public UpdateCenterDtoValidator()
    {
        RuleFor(x => x.CenterName)
            .MaximumLength(100).WithMessage("Center name must be less than 100 characters")
            .When(x => !string.IsNullOrEmpty(x.CenterName));

        RuleFor(x => x.DistrictId)
            .GreaterThan(0).WithMessage("District ID must be greater than 0")
            .When(x => x.DistrictId.HasValue);
    }
}
