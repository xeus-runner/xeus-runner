import type { ILock } from '@emscripten-forge/mambajs';
import { create } from '@emscripten-forge/mambajs';
import type { ILogger as IMambaLogger } from '@emscripten-forge/mambajs-core';
import type { IXeusKernel } from './defs';
import { ILogger } from './logger';

// Standard channel aliases, 'standard' currently points to 'standard-6x'.
const STANDARD_CHANNELS: { [alias: string]: string[] } = {
  'standard-4x': ['https://prefix.dev/emscripten-forge/4x', 'conda-forge'],
  'standard-6x': ['https://prefix.dev/emscripten-forge/6x', 'conda-forge'],
};
STANDARD_CHANNELS['standard'] = STANDARD_CHANNELS['standard-6x'];

/**
 * Create and return environment lock file containing a solved environment.
 *
 * @param options
 * @returns Environment lock file in JSON format.
 */
export async function createEnvLock(options: {
  channels?: string[];
  packages: string[];
  pipPackages?: string[];
  platform?: IXeusKernel.Platform;
  logger?: ILogger;
}): Promise<ILock> {
  const { logger, packages, pipPackages, platform } = options;
  const channels = (options.channels ?? ['standard']).flatMap(
    (channel) => STANDARD_CHANNELS[channel] ?? channel,
  );

  if (channels.length === 0) {
    throw new Error('No channels specified');
  }

  if (packages.length === 0) {
    throw new Error('No packages specified');
  }

  let yml = 'channels:\n';
  channels.forEach((channel) => {
    yml += `- ${channel}\n`;
  });
  yml += `dependencies:\n`;
  packages.forEach((pkg) => {
    yml += `- ${pkg}\n`;
  });

  if (pipPackages !== undefined) {
    yml += '- pip\n';
    yml += '- pip:\n';
    pipPackages.forEach((pkg) => {
      yml += `  - ${pkg}\n`;
    });
  }

  let mambaLogger: IMambaLogger | undefined;
  if (logger !== undefined) {
    mambaLogger = {
      log: (...msg) => logger.log(ILogger.Level.Info, ...msg),
      warn: (...msg) => logger.log(ILogger.Level.Warning, ...msg),
      error: (...msg) => logger.log(ILogger.Level.Error, ...msg),
    };
  }

  // Create environment from YAML definition
  return await create({
    yml,
    platform,
    logger: mambaLogger,
  });
}
