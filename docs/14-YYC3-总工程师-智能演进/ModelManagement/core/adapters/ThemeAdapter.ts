/**
 * @file core/adapters/ThemeAdapter.ts
 * @description 主题系统适配器，解耦具体主题实现
 */

export interface ThemeTokens {
  page: Record<string, string>;
  btn: Record<string, string>;
  text: Record<string, string>;
  status: Record<string, string>;
  [key: string]: any;
}

export interface IThemeAdapter {
  getTokens(): ThemeTokens;
  getToken(path: string): string;
  isDark(): boolean;
  subscribe(callback: (tokens: ThemeTokens) => void): () => void;
}

export class ThemeAdapter implements IThemeAdapter {
  private tokens: ThemeTokens;
  private subscribers = new Set<(tokens: ThemeTokens) => void>();
  
  constructor(initialTokens: ThemeTokens) {
    this.tokens = initialTokens;
  }
  
  getTokens(): ThemeTokens {
    return { ...this.tokens };
  }
  
  getToken(path: string): string {
    const parts = path.split(".");
    let result: any = this.tokens;
    
    for (const part of parts) {
      result = result?.[part];
      if (result === undefined) {
        console.warn(`Theme token not found: ${path}`);
        return "";
      }
    }
    
    return result;
  }
  
  isDark(): boolean {
    return true;
  }
  
  subscribe(callback: (tokens: ThemeTokens) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  updateTokens(newTokens: Partial<ThemeTokens>): void {
    this.tokens = { ...this.tokens, ...newTokens };
    this.subscribers.forEach(cb => cb(this.tokens));
  }
}

export function createThemeAdapter(hook: () => any): IThemeAdapter {
  return new ThemeAdapter(hook());
}