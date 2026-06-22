using Asp.Versioning;
using CustomerApi.API.Controllers.Base;
using CustomerApi.Application.Common.Interfaces;
using CustomerApi.Domain.Entities;
using Microsoft.AspNetCore.Mvc;

namespace CustomerApi.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/HrmSetting")]
public class HrmSettingController(IGenericRepository<HrmSetting> repository) : CrudControllerBase<HrmSetting>(repository)
{
}
