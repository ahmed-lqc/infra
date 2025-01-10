import { Injectable } from "di-wise";

@Injectable()
export class AiThreadService {
  getAiThread(id: string) {
    // For now, return a mock
    return {
      id,
      title: "Mock Thread",
      content: "This is a mock AI thread content.",
    };
  }
}
