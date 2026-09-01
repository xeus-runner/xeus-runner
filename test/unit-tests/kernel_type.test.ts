import type { IKernelType } from '../../src/kernel_type';
import { createKernelType } from '../../src/kernel_type';

describe('createKernelType', () => {
  const params: [string, IKernelType][] = [
    ['cpp', { packageName: 'xeus-cpp', language: 'C++', specName: 'xcpp23' }],
    ['c++', { packageName: 'xeus-cpp', language: 'C++', specName: 'xcpp23' }],
    ['cpp17', { packageName: 'xeus-cpp', language: 'C++', specName: 'xcpp17' }],
    ['c++17', { packageName: 'xeus-cpp', language: 'C++', specName: 'xcpp17' }],
    ['cpp20', { packageName: 'xeus-cpp', language: 'C++', specName: 'xcpp20' }],
    ['c++20', { packageName: 'xeus-cpp', language: 'C++', specName: 'xcpp20' }],
    ['cpp23', { packageName: 'xeus-cpp', language: 'C++', specName: 'xcpp23' }],
    ['c++23', { packageName: 'xeus-cpp', language: 'C++', specName: 'xcpp23' }],
    ['c', { packageName: 'xeus-cpp', language: 'C', specName: 'xc23' }],
    ['c11', { packageName: 'xeus-cpp', language: 'C', specName: 'xc11' }],
    ['c17', { packageName: 'xeus-cpp', language: 'C', specName: 'xc17' }],
    ['c23', { packageName: 'xeus-cpp', language: 'C', specName: 'xc23' }],
    ['fortran', { packageName: 'xeus-lfortran', language: 'LFortran' }],
    ['lfortran', { packageName: 'xeus-lfortran', language: 'LFortran' }],
    ['lua', { packageName: 'xeus-lua', language: 'Lua' }],
    ['octave', { packageName: 'xeus-octave', language: 'Octave' }],
    ['python', { packageName: 'xeus-python', language: 'Python' }],
    ['r', { packageName: 'xeus-r', language: 'R' }],
    ['shakespearelang', { packageName: 'xeus-shakespearelang', language: 'Shakespearelang' }],
    ['sqlite', { packageName: 'xeus-sqlite', language: 'Sqlite' }],
  ];
  params.forEach(async (param) => {
    const input = param[0];
    const output = param[1];

    test(`should accept ${input}`, () => {
      expect(createKernelType(input)).toEqual(output);
    });

    test(`should accept x${input}`, () => {
      expect(createKernelType(`x${input}`)).toEqual(output);
    });

    test(`should accept xeus-${input}`, () => {
      expect(createKernelType(`xeus-${input}`)).toEqual(output);
    });
  });
});
