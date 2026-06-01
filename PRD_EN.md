# Product Requirements Document: KenTaxi
> **Final Project Task 1: Service Idea & PRD Draft**  
> **Course:** Introduction to AI Programming  
> **Submission Date:** June 2, 2026  
> **Affiliation:** Korea Institute of Energy Technology (KENTECH)  

---

## 1. Team Information
The KenTaxi development team is composed of three members who share responsibilities to deliver the service. Jisu serves as the Project Manager and Frontend Lead, taking charge of overall service planning, UI/UX design, responsive single-view dashboard components, and state management. The Backend Lead, whose name will be provided, handles database schema modeling, server routing, and public train API integration. The AI and DevOps Lead, whose name will be provided, is responsible for Socket.io WebSocket chat room connections, the integrated AI chat summarization engine, and final cloud deployment.

## 2. Service Name
The official name of the application is KenTaxi, also referred to as the KENTECH Taxi Sharing Service. The project is represented by the slogan, "Your smart and safe taxi sharing journey from KENTECH to Naju Station."

## 3. Product Overview
KenTaxi is a specialized, mobile-responsive web application integrated with an intelligent AI assistant and direct bank-transfer shortcuts, designed to help KENTECH students, researchers, and faculty members coordinate taxi shares between the campus and Naju Station. By integrating real-time train schedules, utilizing an LLM-based chat summary assistant, and incorporating an **Open Banking-based One-Click Transfer (Direct Transfer Escrow)** mechanism via Toss and Kakaopay deep links, the service reduces individual commuting expenses, completely eliminates manual account typing friction, and ensures secure, error-free payments.

## 4. Target Users
The primary target users are KENTECH undergraduate and graduate students who regularly commute to Naju Station for weekend travel and are eager to split transportation costs. The secondary target audience includes university faculty, researchers, and staff who require prompt, reliable, and secure transport for business trips. Users are highly accustomed to mobile interfaces and value the security provided by a closed community restricted to verified university emails.

## 5. Problem and Need
KENTECH students face a major financial burden due to high taxi fares of 8,000 to 10,000 KRW for a single ride, combined with highly infrequent bus schedules. Currently, coordinating taxi shares depends on fragmented and inefficient channels like anonymous forums or temporary open chats, where matching is slow and requires constant manual messaging. Furthermore, students lack integrated tools to track train delays or coordinate departures. Finally, after a ride, they face the friction and typing error risks of manually entering recipient account numbers and split amounts across separate banking applications.

## 6. Core User Scenario
In a typical user journey, Jisu wants to travel to Naju Station on a Friday afternoon to catch a train departing at 14:30. Jisu logs into KenTaxi using a verified university email, selects the route from campus to the station, and filters by the 14:30 train. Finding a pool departing at 14:00 (which is automatically set to thirty minutes before train departure) with two open seats, Jisu clicks to join and confirm. Jisu opens the integrated private group chat to coordinate the meeting point, meets the pool riders, and takes the taxi. Upon arrival, the pool leader enters the total taxi fare (e.g., 9,000 KRW). The system automatically calculates the 1/N split (e.g., 3,000 KRW) and renders a custom **[One-Click Toss/Kakaopay Transfer ⚡]** button. Jisu taps the button, which immediately launches their native Toss or Kakaopay app with the recipient bank, account number, and exact amount of 3,000 KRW pre-filled. Jisu completes the transfer with single biometric verification, and the platform automatically marks their status as settled.

## 7. Key Features
* **Feature 1: Real-time Train Schedule Integration (Train Timeline):** Retrieves train schedules and delay updates from the public data portal to display live SRT and KTX timetables directly on a responsive panel.
* **Feature 2: Smart Departure Calculation & Pool Matching (Smart Pool Matching):** Automatically sets optimal departure times thirty minutes before train departures (or right after arrivals) and enforces a strict four-passenger limit per taxi with color-coded occupancy badges.
* **Feature 3: Open Banking-based One-Click Transfer & Direct Transfer Escrow:** Integrates native banking deep link schemas (Toss, Kakaopay) to generate pre-filled transfer links based on 1/N split calculations. This allows users to complete transfers with a single tap and biometric verification inside their native banking app. This **Zero-Custody architecture** completely bypasses the legal/regulatory hurdles of holding user deposits while ensuring secure, error-free, and instantly tracked payments.

## 8. AI Usage Plan
The project utilizes AI in two major ways. During the development phase, the team leverages AI coding agents and Copilot to design the Next.js App Router, manage state using Zustand, optimize Prisma schemas, and streamline Socket.io WebSocket connections. In the production app, KenTaxi implements an LLM API to parse chat logs in real-time to extract and pin essential meeting locations and payment accounts. It also leverages this text intelligence to trigger the one-click transfer action sheet based on natural chat discussions.

## 9. Page Structure
The application is designed as a single-view full-screen dashboard to minimize navigation clicks. It features a secure Login and Registration page restricted to KENTECH email domains. The Main Dashboard includes a header with route switches and user status, a left panel showing the Train Timeline, a right panel displaying the Pool Cards, and a bottom bar with a pool creation button. Clicking to join or create a pool triggers a slide-up bottom sheet. Once a user joins a pool, the right panel seamlessly transitions into the Group Chat view, showcasing the live AI summary banner, immediate message stream, and the **⚡ Open Banking One-Click Transfer Panel** at the bottom. A separate Profile Page allows users to manage their ride history and saved settlement bank accounts.

## 10. Development Plan
The development roadmap is organized into four distinct stages. The first stage, spanning June 3 to June 5, focuses on the UI Prototype and Mockup, where Jisu will set up the Next.js project and build the responsive dashboard views and Zustand state layers. The second stage, from June 6 to June 8, focuses on Database and REST API construction, where Team Member B will configure the PostgreSQL database with Prisma and build the train synchronization scheduler. The third stage, running from June 9 to June 11, focuses on WebSocket & Open Banking, where Team Member C will develop the Socket.io real-time server and integrate Toss/Kakaopay deep link payment schemas. The fourth and final stage, from June 12 to June 14, covers AI Integration and Deployment, where the entire team will collaborate to link the LLM summary engine, audit mobile touch responsiveness, and deploy the system on Vercel and Supabase.
