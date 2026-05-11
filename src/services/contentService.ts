export interface SectionContent {
  section_id: string;
  content: string;
}

class ContentService {
  private gasUrl: string = import.meta.env.VITE_GAS_URL || '';

  async fetchAll(): Promise<Record<string, string>> {
    if (!this.gasUrl) return {};
    
    try {
      const response = await fetch(this.gasUrl);
      const data = await response.json();
      
      const contentMap: Record<string, string> = {};
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item.section_id && item.content) {
            contentMap[item.section_id] = item.content;
          }
        });
      }
      return contentMap;
    } catch (error) {
      console.error('Error fetching content:', error);
      return {};
    }
  }

  async updateSection(updates: { section_id: string; content: string } | { section_id: string; content: string }[]): Promise<boolean> {
    if (!this.gasUrl) {
      console.warn('VITE_GAS_URL not set. Review Mode only.');
      return true; // Pretend it worked for local dev
    }

    try {
      await fetch(this.gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(updates),
      });
      return true;
    } catch (error) {
      console.error('Error updating content:', error);
      return false;
    }
  }
}

export const contentService = new ContentService();
