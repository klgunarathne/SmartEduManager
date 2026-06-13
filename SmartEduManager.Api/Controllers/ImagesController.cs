using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SmartEduManager.Api.Helpers;
using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class ImagesController : ControllerBase
{
    private readonly ImageUploadHelper _imageUploadHelper;
    private readonly ILogger<ImagesController> _logger;

    public ImagesController(ImageUploadHelper imageUploadHelper, ILogger<ImagesController> logger)
    {
        _imageUploadHelper = imageUploadHelper;
        _logger = logger;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadImage([FromForm] ImageUploadDto model)
    {
        try
        {
            if (model.File == null || model.File.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            var imagePath = await _imageUploadHelper.UploadImageAsync(model.File, model.SubFolder);
            
            return Ok(new 
            { 
                message = "Image uploaded successfully", 
                imagePath = imagePath,
                imageUrl = $"{Request.Scheme}://{Request.Host}{imagePath}"
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Invalid image upload request");
            return BadRequest("Invalid image upload request");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image");
            return StatusCode(500, "Error uploading image");
        }
    }

    [HttpDelete("delete")]
    public IActionResult DeleteImage([FromQuery] string imagePath)
    {
        try
        {
            if (string.IsNullOrEmpty(imagePath))
            {
                return BadRequest("Image path is required");
            }

            var deleted = _imageUploadHelper.DeleteImage(imagePath);
            
            if (deleted)
            {
                return Ok(new { message = "Image deleted successfully" });
            }

            return NotFound("Image not found");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting image");
            return StatusCode(500, "Error deleting image");
        }
    }
}