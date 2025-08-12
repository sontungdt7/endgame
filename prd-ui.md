## **1️⃣ App Overview**

* **App Name:** ViralPost
* **Goal:** Allow sponsors to attach **USDC prize pools** to Zora posts and create a **"Last Buyer Wins"** game (BullRun) to make posts go viral.
* **Users:**
  * **Sponsors:** Launch BullRun campaigns on specific posts.
  * **Players:** Buy post coins via BullRun and compete to win the USDC prize pool.

---

## **2️⃣ Core Screens**

### **1. Home / Explore**

* **Purpose:** Browse active and ended BullRun campaigns.
* **Components:**
  * Header with **ViralPost** branding and **Log in** button.
  * Centered tab navigation: **Active Games** and **Ended Games**
  * Game cards display:
    * **Game ID** (instead of status)
    * Thumbnail of Zora post
    * USDC Prize Pool amount
    * **Active Games:** Total Players, Time Left, **View Game** button
    * **Ended Games:** Winner Address, Time Left, **View Game** button

---

### **2. BullRun Game Detail (Active Games)**

* **Purpose:** Show live trading interface for active BullRun games.
* **Components:**
  * **Trading-style header:** Token information with game stats
  * **Post preview:** Title, content, and post coin address
  * **Stats bar:** Prize pool, countdown timer, current leader, total players
  * **Trading Interface:**
    * **Buy Tab:** Amount input, USDC selector, quick amount buttons (0.001, 0.01, 0.1, Max), minimum received display
    * **Sell Tab:** Amount input, token selector, percentage buttons (25%, 50%, 75%, 100%)
    * Balance display and wallet integration
  * **Transaction History:** Recent game activity in table format
  * **Game Rules:** "Be the last buyer before the timer hits zero to win the USDC prize."

---

### **3. BullRun Game Detail (Ended Games)**

* **Purpose:** Show completed game status and prize claiming.
* **Components:**
  * Same layout as active games but with:
    * **Winner information** displayed prominently
    * **Action buttons** instead of trading interface:
      * **Claim Prize** (enabled for winner, disabled for others)
      * **Refund Prize Pool** (if no players joined)
    * Game status shows "Ended"

---

### **4. Create Game (For Sponsors)**

* **Purpose:** Allow sponsors to launch a BullRun game on a specific post.
* **Form Inputs:**
  * PostCoin address (text input, validated)
  * USDC prize pool (min 100 USDC)
  * Default 24-hour duration (Game Duration section removed)
* **Game Rules Section:** Explains the "Last Buyer Wins" mechanics
* **Launch Game button:** Sends createGame transaction.
* **Confirmation screen:**
  * Shows BullRun game link.
  * "Share Campaign" button to copy link or share on social platforms.

---

## **3️⃣ Key UI Elements**

* **Trading Interface:** Professional trading-style layout with Buy/Sell tabs
* **Dynamic Countdown Timer:** Real-time updates with color coding (red for urgent)
* **Game ID Display:** Unique identifier for each game in blue badges
* **Total Players Counter:** Shows participation level instead of last buyer
* **USDC Prize Pool Counter:** Large, visible on all game screens
* **Winner Highlighting:** Clear display of game winners in ended games
* **Log in Button:** Wallet connection with dropdown menu for connected users

---

## **4️⃣ Theme & Style**

* **Colors:** Dark background with neon green highlights for active elements, magenta for sell actions
* **Typography:** Bold, high-contrast for prize pools and timers using modern font combinations
* **Layout:** Trading interface aesthetic with professional table layouts
* **Mobile-first:** Responsive design with centered navigation tabs
* **Visual Hierarchy:** Clear separation between active and ended game states

---

## **5️⃣ Smart Contract Interactions**

* **CreateGame(gameParams)** → Sponsor deploys BullRun game with 24h default duration
* **BuyPostCoin(gameId, msg.value)** → Player buys PostCoin via trading interface
* **SellPostCoin(gameId, amount)** → Player sells PostCoin via trading interface  
* **ClaimPrize(gameId)** → Winner claims USDC prize when game ends
* **RefundPrizePool(gameId)** → Sponsor retrieves funds if no players joined

---

## **6️⃣ Navigation & User Flow**

* **Simplified Navigation:** Home, Create Game, and wallet connection only
* **Removed Screens:** My BullRuns and My Games dashboards eliminated for streamlined experience
* **Unified Game View:** Both active and ended games use same detail page with contextual interfaces
* **Wallet Integration:** Mock wallet system with persistent connection state

---

## **7️⃣ Game Card Information**

### **Active Games Cards:**
* Game ID badge
* Post thumbnail
* Prize Pool amount  
* Total Players count
* Time Left with color coding
* View Game button

### **Ended Games Cards:**
* Game ID badge
* Post thumbnail
* Prize Pool amount
* Winner Address
* Time Left (shows "Ended")
* View Game button

---
