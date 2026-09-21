/**
 * Minimal Bun type shims for the headless fight scripts.
 * `bun-types` isn't a project dependency, so declare just the surface used.
 */

export {};

declare global {
  interface ImportMeta {
    readonly dir: string;
  }

  namespace Bun {
    interface BuildArtifact {
      readonly path: string;
    }

    interface BuildMessage {
      readonly message?: string;
    }

    interface BuildOutput {
      readonly success: boolean;
      readonly logs: BuildMessage[];
      readonly outputs: BuildArtifact[];
    }

    interface OnResolveArgs {
      readonly path: string;
      readonly importer: string;
    }

    interface PluginBuilder {
      onResolve(
        options: { filter: RegExp },
        callback: (args: OnResolveArgs) => { path: string } | undefined
      ): void;
    }

    interface BunPlugin {
      readonly name: string;
      setup(build: PluginBuilder): void;
    }

    interface BuildConfig {
      entrypoints: string[];
      outdir?: string;
      target?: 'browser' | 'bun' | 'node';
      plugins?: BunPlugin[];
    }

    function build(config: BuildConfig): Promise<BuildOutput>;
  }
}
