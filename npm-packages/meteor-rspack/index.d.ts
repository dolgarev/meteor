/**
 * Extend Rspack’s Configuration with Meteor-specific options.
 */
import {
  defineConfig as _rspackDefineConfig,
  Configuration as _RspackConfig,
} from '@rspack/cli';

export interface MeteorRspackConfig extends _RspackConfig {
  meteor?: {
    packageNamespace?: string;
  };
}

type MeteorEnv = Record<string, any> & {
  isDevelopment: boolean;
  isProduction: boolean;
  isClient: boolean;
  isServer: boolean;
  isTest: boolean;
  isDebug: boolean;
  isRun: boolean;
  isBuild: boolean;
  isReactEnabled: boolean;
  isBlazeEnabled: boolean;
  isBlazeHotEnabled: boolean;
}

export type ConfigFactory = (
  env: MeteorEnv,
  argv: Record<string, any>
) => MeteorRspackConfig;

export function defineConfig(
  factory: ConfigFactory
): ReturnType<typeof _rspackDefineConfig>;
