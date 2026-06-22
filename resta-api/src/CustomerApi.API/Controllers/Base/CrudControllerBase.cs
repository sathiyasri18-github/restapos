using CustomerApi.Application.Common;
using CustomerApi.Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace CustomerApi.API.Controllers.Base;

public abstract class CrudControllerBase<T>(IGenericRepository<T> repository) : ControllerBase where T : class
{
    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await repository.GetAllAsync(pageNumber, pageSize, ct);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(int id, CancellationToken ct)
    {
        if (!repository.HasIntegerId)
            return NotFound($"{typeof(T).Name} does not support lookup by integer id.");

        var entity = await repository.GetByIdAsync(id, ct);
        return entity is null ? NotFound() : Ok(entity);
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    public async Task<IActionResult> Create([FromBody] T entity, CancellationToken ct)
    {
        var created = await repository.AddAsync(entity, ct);
        if (EntityIdHelper.HasIntegerId(typeof(T)))
        {
            var id = EntityIdHelper.GetIdValue(created);
            return CreatedAtAction(nameof(GetById), new { id }, created);
        }

        return Created(string.Empty, created);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(int id, [FromBody] T entity, CancellationToken ct)
    {
        if (!repository.HasIntegerId)
            return NotFound($"{typeof(T).Name} does not support update by integer id.");

        if (!await repository.ExistsAsync(id, ct))
            return NotFound();

        EntityIdHelper.SetIdValue(entity, id);
        var updated = await repository.UpdateAsync(entity, ct);
        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        if (!repository.HasIntegerId)
            return NotFound($"{typeof(T).Name} does not support delete by integer id.");

        var deleted = await repository.DeleteByIdAsync(id, ct);
        return deleted ? NoContent() : NotFound();
    }

    [HttpDelete("by-key")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteByKey([FromBody] T entity, CancellationToken ct)
    {
        var deleted = await repository.DeleteAsync(entity, ct);
        return deleted ? NoContent() : NotFound();
    }
}
