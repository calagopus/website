export class YamlFloat {
  value: number;

  constructor(value: number) {
    this.value = value;
  }
}

export const float = (value: number): YamlFloat => new YamlFloat(value);

export type YamlValue = string | number | boolean | YamlFloat | YamlValue[] | { [key: string]: YamlValue };

export type NoteType = 'info' | 'tip' | 'warning' | 'danger';

export interface ConfigNote {
  type: NoteType;
  title?: string;
  body: string;
}

export interface ConfigOption {
  key: string;
  description: string;
  values?: string[];
  default?: YamlValue;
  platformDefaults?: Record<string, YamlValue>;
  platforms?: string[];
  example?: YamlValue;
  inExample?: boolean;
  notesBefore?: ConfigNote[];
  notesAfter?: ConfigNote[];
}

export interface ConfigSection {
  title: string;
  body?: string;
  notes?: ConfigNote[];
  options?: ConfigOption[];
  inExample?: boolean;
}

export interface ConfigPlatform {
  id: string;
  label: string;
}

export interface ConfigDoc {
  outFile: string;
  sourceFile: string;
  title: string;
  intro: string;
  sections: ConfigSection[];
  example: {
    title: string;
    body: string;
    platforms: ConfigPlatform[];
  };
}
