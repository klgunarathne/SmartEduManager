namespace SmartEduManager.Api.Models;

public class ImageUploadDto
{
    public IFormFile File { get; set; } = null!;
    public string SubFolder { get; set; } = "images";
}
