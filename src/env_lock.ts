import type { ILock } from '@emscripten-forge/mambajs';
import { create } from '@emscripten-forge/mambajs';
import type { ILogger as IMambaLogger } from '@emscripten-forge/mambajs-core';
import { IXeusKernel } from './defs';

// This will eventually be used elsewhere, not just here.
export type ILogger = (text: string) => void;

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
  logger?: ILogger;
}): Promise<ILock> {
  const { logger, packages, pipPackages } = options;
  const channels = options.channels ?? IXeusKernel.DEFAULT_CHANNELS;

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
    function toLogger(...msg: any[]): void {
      logger!(msg.map((s) => `${s}`).join(' '));
    }

    mambaLogger = {
      log: (...msg) => toLogger(msg),
      warn: (...msg) => toLogger(msg),
      error: (...msg) => toLogger(msg),
    };
  }

  // Create environment from YAML definition
  return await create({ yml, logger: mambaLogger });
}
