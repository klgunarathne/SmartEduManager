using Microsoft.AspNetCore.Mvc;
using SmartEduManager.Api.Helpers;
using SmartEduManager.Api.Models;

namespace SmartEduManager.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ImagesController : ControllerBase
{
    private readonly ImageUploadHelper _imageUploadHelper;

    public ImagesController(ImageUploadHelper imageUploadHelper)
    {
        _imageUploadHelper = imageUploadHelper;
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
            return BadRequest(ex.Message);
        }
        catch (Exception ex)
        {
            return StatusCode(500, $"Error uploading image: {ex.Message}");
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
            return StatusCode(500, $"Error deleting image: {ex.Message}");
        }
    }
}