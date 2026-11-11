// :title: Async concurrent tasks

import { DOMMessageHandler, XeusKernel } from 'xeus-runner';

const kernel = new XeusKernel({
  type: 'python',
  packages: ['numpy'],
  messageHandler: new DOMMessageHandler({ targetElement: 'target' }),
  // :worker:
});

kernel.execute({
  code: `import asyncio

async def recv_send(event1, event2):
    print('1) waiting for event1')
    await event1.wait()
    print('2) received event1')
    await asyncio.sleep(3)
    event2.set()
    print('3) set event2, finished')

event1 = asyncio.Event()
event2 = asyncio.Event()
waiter_task = asyncio.create_task(recv_send(event1, event2))`,
});

kernel.execute({
  code: `async def send_recv(event1, event2):
    print('a) waiting at start')
    await asyncio.sleep(2)
    event1.set()
    print('b) set event1, waiting for event2')
    await event2.wait()
    print('c) finished')

sender_task = asyncio.create_task(send_recv(event1, event2))`,
});

kernel.execute({ code: `print(event1.is_set(), event2.is_set())` });
