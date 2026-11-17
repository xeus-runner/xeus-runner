/**
 * Unique identifier for kernel type.
 */
export interface KernelType {
  /**
   * Name of the Emscripten-forge package containing the kernel, such as 'xeus-python'.
   */
  packageName: string;

  /**
   * Name of kernel spec file within the `packageName` package.
   *
   * Often there is only one kernel spec in a package so this does not need to be specified, but for
   * packages containing more than one kernel spec such as 'xeus-cpp' this is needed to uniquely
   * identify the kernel.
   *
   * Maps to the file `share/jupyter/kernels/${specName}/kernel.json`
   */
  specName?: string;

  /**
   * Kernel language in human-readable format, such as 'Python' or 'C++'.
   *
   * Does not include the version of the language.
   *
   * Not part of the unique identifier but useful to have.
   */
  language: string;
}

/**
 * Create and return a kernel type from an input string, trying to be a permissive as possible.
 * For example, an `input` of 'python', 'xpython' or 'xeus-python' will identify a Python kernel.
 *
 * For packages containing more than one kernel type such as 'xeus-cpp', you can request a specific
 * type such as C++23 using an `input` of 'c++23' (or the equivalent 'cpp23', 'xc++23', 'xcpp23',
 * 'xeus-c++23' or 'xeus-cpp23') or request the latest C++ version using 'c++' (or the equivalent
 * 'cpp', 'xc++', 'xcpp', 'xeus-c++' or 'xeus-cpp').
 *
 * Not case sensitive as `input` is converted to lower case.
 *
 * Never throws an exception as it is not aware of what is a valid kernel or not, that information
 * is contained within the Emscrioten-forge packages.
 *
 * @param input
 *
 * @category Helpers
 */
export function createKernelType(input: string): KernelType {
  // Sanitise input.
  input = input.toLowerCase();
  if (input.startsWith('xeus-')) {
    input = input.slice(5);
  } else if (input.startsWith('x')) {
    input = input.slice(1);
  }

  // Support both 'c++' and 'cpp' for C++.
  if (input.startsWith('c++')) {
    input = `cpp${input.slice(3)}`;
  }

  // Default Fortran is LFortran.
  if (input === 'fortran') {
    input = 'lfortran';
  }

  let language: string | undefined;
  if (input === 'lfortran') {
    language = 'LFortran'; // Capitalise first 2 letters.
  } else {
    // Default is to capitalise first letter.
    language = input.length > 0 ? input[0].toUpperCase() + input.slice(1) : '';
  }

  let packageName = `xeus-${input}`;

  // Kernels with more than one kernel spec.
  let specName: string | undefined;
  if (input === 'cpp') {
    specName = 'xcpp23'; // Default C++ version.
    language = 'C++';
    packageName = 'xeus-cpp';
  } else if (input === 'c') {
    specName = 'xc23'; // Default C version.
    packageName = 'xeus-cpp';
    language = 'C';
  } else if (/^cpp(\d+)$/.test(input)) {
    specName = `x${input}`; // Requested C++ version.
    packageName = 'xeus-cpp';
    language = 'C++';
  } else if (/^c(\d+)$/.test(input)) {
    specName = `x${input}`; // Requested C version.
    packageName = 'xeus-cpp';
    language = 'C';
  }

  return { packageName, specName, language };
}
