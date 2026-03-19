import httpx, asyncio, time
async def test():
    async with httpx.AsyncClient() as c:
        start = time.time()
        tasks = [c.get('http://localhost:8000/sync-slow') for _ in range(5)]
        await asyncio.gather(*tasks)
        print('sync:', time.time()-start)
        start = time.time()
        tasks = [c.get('http://localhost:8000/async-slow') for _ in range(5)]
        await asyncio.gather(*tasks)
        print('async:', time.time()-start)
asyncio.run(test())