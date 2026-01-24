using AutoMapper;
using SmartEduManager.Api.DTOs;
using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Profiles;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User mapping
        CreateMap<ApplicationUser, UserDto>();
        CreateMap<RegisterDto, ApplicationUser>();

        // District mapping
        CreateMap<District, DistrictDto>();
        CreateMap<CreateDistrictDto, District>();
        CreateMap<UpdateDistrictDto, District>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Center mapping
        CreateMap<Center, CenterDto>()
            .ForMember(dest => dest.DistrictName, opt => opt.MapFrom(src => src.District.DistrictName));
        CreateMap<CreateCenterDto, Center>();
        CreateMap<UpdateCenterDto, Center>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Course mapping
        CreateMap<Course, CourseDto>()
            .ForMember(dest => dest.CenterName, opt => opt.MapFrom(src => src.Center.CenterName));
        CreateMap<CreateCourseDto, Course>();
        CreateMap<UpdateCourseDto, Course>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Instructor mapping
        CreateMap<Instructor, InstructorDto>();
        CreateMap<CreateInstructorDto, Instructor>();
        CreateMap<UpdateInstructorDto, Instructor>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // CourseInstructor mapping
        CreateMap<CourseInstructor, CourseInstructorDto>()
            .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.Course.CourseName))
            .ForMember(dest => dest.InstructorName, opt => opt.MapFrom(src => src.Instructor.FullName));
        CreateMap<CreateCourseInstructorDto, CourseInstructor>();
        CreateMap<UpdateCourseInstructorDto, CourseInstructor>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Batch mapping
        CreateMap<Batch, BatchDto>()
            .ForMember(dest => dest.CourseName, opt => opt.MapFrom(src => src.Course.CourseName));
        CreateMap<CreateBatchDto, Batch>();
        CreateMap<UpdateBatchDto, Batch>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Student mapping
        CreateMap<Student, StudentDto>()
            .ForMember(dest => dest.BatchCode, opt => opt.MapFrom(src => src.Batch.BatchCode));
        CreateMap<CreateStudentDto, Student>();
        CreateMap<UpdateStudentDto, Student>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));
    }
}