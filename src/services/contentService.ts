export interface SectionContent {
  section_id: string;
  content: string;
}

class ContentService {
  private gasUrl: string = import.meta.env.VITE_GAS_URL || '';

  async fetchAll(): Promise<Record<string, string>> {
    console.log('[ContentService] Fetching all content from GAS...');
    if (!this.gasUrl) {
      console.warn('[ContentService] VITE_GAS_URL is missing.');
      return {};
    }
    
    try {
      const cacheBuster = `${this.gasUrl.includes('?') ? '&' : '?'}t=${Date.now()}`;
      let response: Response;
      try {
        response = await fetch(`${this.gasUrl}${cacheBuster}`);
      } catch (clientErr) {
        console.warn('[ContentService] Direct GAS fetch blocked or failed, attempting proxy fallback...', clientErr);
        response = await fetch('/api/proxy/gas');
      }

      if (!response.ok) {
        console.warn(`[ContentService] Fetch returned status: ${response.status}`);
        return {};
      }
      
      const data = await response.json();
      console.log('[ContentService] Raw data received:', data);
      
      const contentMap: Record<string, string> = {};
      
      // If the script returns an object { section_id: content }
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        console.log('[ContentService] Parsing object response');
        return data as Record<string, string>;
      }
      
      // Fallback for array format
      if (Array.isArray(data)) {
        console.log('[ContentService] Parsing array response');
        data.forEach((item: any) => {
          if (item.section_id && item.content) {
            contentMap[item.section_id] = item.content;
          }
        });
      }
      
      console.log('[ContentService] Final content map:', contentMap);
      return contentMap;
    } catch (error) {
      console.error('[ContentService] Error fetching content:', error);
      return {};
    }
  }

  async updateSection(updates: { section_id: string; content?: string; delete?: boolean } | { section_id: string; content?: string; delete?: boolean }[]): Promise<boolean> {
    console.log('[ContentService] Updating section(s):', updates);
    if (!this.gasUrl) {
      console.warn('[ContentService] VITE_GAS_URL not set. Updates will not persist.');
      return true;
    }

    try {
      // no-cors is used because GAS redirects frequently fail CORS checks in simple fetch
      await fetch(this.gasUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'no-cors',
        body: JSON.stringify(updates),
      });
      console.log('[ContentService] Update request sent successfully (blind mode)');
      return true;
    } catch (error) {
      console.error('[ContentService] Error updating content:', error);
      return false;
    }
  }
}

export const contentService = new ContentService();
