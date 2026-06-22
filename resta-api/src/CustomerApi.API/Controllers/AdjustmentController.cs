using Asp.Versioning;
using CustomerApi.API.Controllers.Base;
using CustomerApi.Application.Common.Interfaces;
using CustomerApi.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace CustomerApi.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/Adjustment")]
public class AdjustmentController(IGenericRepository<Adjustment> repository) : CrudControllerBase<Adjustment>(repository)
{
}
