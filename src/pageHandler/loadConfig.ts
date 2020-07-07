import fs from 'fs';
import path from 'path';
import { DEFAULT_CONFIG_PATH, CONFIG_EXAMPLE } from '../lib/constants';
import { StoreOption, UseConfigOption, PostStoreConfig } from '../typings';
import { getStyledErrorMsg } from '../lib/msgHandler';
import chalk from 'chalk';

export const loadConfig = async ({
  storeName,
  configPath = DEFAULT_CONFIG_PATH,
}: UseConfigOption): Promise<StoreOption> => {
  const { storeOption } = await getConfig(path.resolve(configPath));

  if (Array.isArray(storeOption)) {
    if (!storeName) {
      throw new Error(
        getStyledErrorMsg(
          'If the storeOption property in the config object is an array, storeName is required.',
        ),
      );
    }

    const findedOption = storeOption.find(
      (option) => option.storeName === storeName,
    );
    if (!findedOption) {
      throw new Error(
        getStyledErrorMsg(
          'There is no option corresponding to storeName.',
          `name: ${storeName}`,
        ),
      );
    }

    return findedOption;
  }

  return storeOption;
};

const getConfig = async (configPath: string): Promise<PostStoreConfig> => {
  let config: Partial<PostStoreConfig>;

  try {
    fs.statSync(configPath);
  } catch {
    throw new Error(
      getStyledErrorMsg(
        'Please ensure that the config file exists.',
        `path: ${configPath}`,
      ),
    );
  }

  try {
    const importedModule = await import(configPath);
    if (importedModule.default) {
      config = importedModule.default;
    } else {
      config = importedModule;
    }
  } catch {
    throw new Error(
      getStyledErrorMsg('This is not a module file.', `path: ${configPath}`),
    );
  }

  if (!validateConfig(config)) {
    throw new Error(
      getStyledErrorMsg('The configuration should look like below.') +
        chalk`\n{yellow.bold ${CONFIG_EXAMPLE}}`,
    );
  }

  return config;
};

const validateConfig = (
  config: Partial<PostStoreConfig>,
): config is PostStoreConfig => {
  if (!config || !config.storeOption) return false;

  const storeOption = config.storeOption;

  if (Array.isArray(storeOption)) {
    return storeOption.every((sOption) => validateStoreOption(sOption));
  }

  return validateStoreOption(storeOption);
};

const validateStoreOption = (option: StoreOption) => {
  if (!option.postDir) return false;
  return true;
};
