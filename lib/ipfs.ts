/**
 * IPFS Upload Utility
 * Supports uploading files to IPFS using Storacha (formerly web3.storage) or Pinata
 * 
 * Documentation: https://docs.storacha.network/how-to/upload/
 * Status: https://storacha.statuspage.io/
 */

export interface IPFSUploadResult {
  ipfsUrl: string
  ipfsHash: string
  gatewayUrl: string
}

// Lazy load Storacha client to avoid bundling in server-side code
let storachaClient: any = null
let storachaInitialized = false

async function getStorachaClient() {
  if (typeof window === 'undefined') {
    throw new Error("Storacha client can only be used in browser environment")
  }

  if (storachaInitialized && storachaClient) {
    return storachaClient
  }

  try {
    // Dynamically import @storacha/client only in browser
    const { create } = await import('@storacha/client')
    const client = await create()
    storachaClient = client
    storachaInitialized = true
    return client
  } catch (error) {
    // If module not found, it means package isn't installed - return null instead of throwing
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes("Cannot find module") || errorMessage.includes("MODULE_NOT_FOUND")) {
      return null // Signal that Storacha is not available
    }
    throw new Error(
      `Failed to load Storacha client. Make sure @storacha/client is installed: ` +
      `npm install @storacha/client. Error: ${errorMessage}`
    )
  }
}

/**
 * Upload file to IPFS using Storacha (formerly web3.storage)
 * Requires user to have logged in with their email via client.login() first
 * 
 * See: https://docs.storacha.network/how-to/upload/
 * Returns null if Storacha package is not installed (allows graceful fallback)
 */
export async function uploadToIPFSStoracha(
  file: File,
  email?: string
): Promise<IPFSUploadResult | null> {
  try {
    const client = await getStorachaClient()
    
    // If client is null, package isn't installed - return null for graceful fallback
    if (!client) {
      console.info("Storacha client not available (package not installed), skipping...")
      return null
    }
    
    // If email is provided and client is not logged in, try to login
    if (email && !client.currentSpace()) {
      await client.login(email)
      // Note: User needs to click confirmation link in email
      // This might need to be handled separately in the UI
    }

    // Check if we have a current space
    const currentSpace = client.currentSpace()
    if (!currentSpace) {
      throw new Error(
        "No Storacha space available. Please login with your email first using client.login(email). " +
        "After clicking the confirmation link in your email, the client will have access to your spaces."
      )
    }

    // Upload the file
    const cid = await client.uploadFile(file)
    const ipfsHash = cid.toString()
    const ipfsUrl = `ipfs://${ipfsHash}`
    const gatewayUrl = `https://${ipfsHash}.ipfs.w3s.link`

    return {
      ipfsUrl,
      ipfsHash,
      gatewayUrl,
    }
  } catch (error) {
    console.error("Error uploading to IPFS (Storacha):", error)
    
    // Check if it's a maintenance or availability error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes("maintenance") || errorMessage.includes("undergoing")) {
      throw new Error(
        `Storacha is currently undergoing maintenance. Check https://storacha.statuspage.io/ for updates. ` +
        `Original error: ${errorMessage}`
      )
    }
    
    throw error
  }
}

/**
 * Upload file to IPFS using Pinata
 * 
 * Pinata now uses JWT tokens for authentication. You can get your JWT from:
 * https://app.pinata.cloud/developers/api-keys
 * 
 * Make sure your API key has the required scopes:
 * - For pinFileToIPFS: "pinFileToIPFS" scope or Admin access
 * 
 * Documentation: https://docs.pinata.cloud/files/uploading-files
 */
export async function uploadToIPFSPinata(
  file: File,
  jwt?: string,
  apiKey?: string,
  apiSecret?: string
): Promise<IPFSUploadResult> {
  // Try JWT first (new method), then fall back to legacy API key/secret
  const jwtToken = jwt || process.env.NEXT_PUBLIC_PINATA_JWT
  const key = apiKey || process.env.NEXT_PUBLIC_PINATA_API_KEY
  const secret = apiSecret || process.env.NEXT_PUBLIC_PINATA_API_SECRET

  if (!jwtToken && (!key || !secret)) {
    throw new Error(
      "Pinata API credentials not configured. Please set either:\n" +
      "1. NEXT_PUBLIC_PINATA_JWT (recommended - get from https://app.pinata.cloud/developers/api-keys)\n" +
      "2. Or both NEXT_PUBLIC_PINATA_API_KEY and NEXT_PUBLIC_PINATA_API_SECRET (legacy method)\n\n" +
      "Make sure your API key has the 'pinFileToIPFS' scope enabled."
    )
  }

  try {
    const formData = new FormData()
    formData.append("file", file)

    // Add metadata
    const metadata = JSON.stringify({
      name: file.name,
    })
    formData.append("pinataMetadata", metadata)

    // Add options
    const options = JSON.stringify({
      cidVersion: 1,
    })
    formData.append("pinataOptions", options)

    // Use JWT Bearer token (new method) or legacy headers
    const headers: HeadersInit = {}
    if (jwtToken) {
      headers["Authorization"] = `Bearer ${jwtToken}`
    } else {
      // Legacy method (still supported but deprecated)
      headers["pinata_api_key"] = key!
      headers["pinata_secret_api_key"] = secret!
    }

    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers,
      body: formData,
    })

    if (!response.ok) {
      let errorMessage = "IPFS upload failed"
      let errorDetails: any = null
      
      try {
        // Try to get JSON error response first
        const responseText = await response.text()
        try {
          const errorData = JSON.parse(responseText)
          errorDetails = errorData
          
          if (errorData.error) {
            errorMessage = errorData.error.reason || errorData.error.details || JSON.stringify(errorData.error)
            
            // Provide helpful error messages for common issues
            if (errorData.error.reason === "NO_SCOPES_FOUND") {
              throw new Error(
                `Pinata API key missing required scopes. Please:\n` +
                `1. Go to https://app.pinata.cloud/developers/api-keys\n` +
                `2. Edit your API key and ensure it has the "pinFileToIPFS" scope enabled\n` +
                `3. Or create a new Admin key with full permissions\n` +
                `4. Update your NEXT_PUBLIC_PINATA_JWT with the new JWT token\n\n` +
                `See: https://docs.pinata.cloud/quickstart`
              )
            }
          } else {
            errorMessage = responseText || JSON.stringify(errorData)
          }
        } catch (parseError) {
          // If JSON parsing fails, use the text response
          errorMessage = responseText || `HTTP ${response.status}: ${response.statusText}`
        }
      } catch (fetchError) {
        errorMessage = `HTTP ${response.status}: ${response.statusText || "Unknown error"}`
      }
      
      // Include full error details for debugging
      const fullError = errorDetails 
        ? `IPFS upload failed: ${errorMessage}\n\nFull error: ${JSON.stringify(errorDetails, null, 2)}`
        : `IPFS upload failed: ${errorMessage}`
      
      throw new Error(fullError)
    }

    const responseData = await response.json()
    const ipfsHash = responseData.IpfsHash || responseData.cid
    
    if (!ipfsHash) {
      throw new Error(
        `Pinata upload succeeded but no CID/hash returned. Response: ${JSON.stringify(responseData)}\n\n` +
        `Please check your API key configuration at https://app.pinata.cloud/developers/api-keys\n` +
        `See also: https://docs.pinata.cloud/quickstart`
      )
    }
    
    const ipfsUrl = `ipfs://${ipfsHash}`
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`

    return {
      ipfsUrl,
      ipfsHash,
      gatewayUrl,
    }
  } catch (error) {
    console.error("Error uploading to IPFS (Pinata):", error)
    throw error
  }
}

/**
 * Upload file to IPFS using the preferred service
 * Tries Storacha first (if available), then Pinata as fallback
 * Defaults to Pinata if Storacha package is not installed
 */
export async function uploadToIPFS(
  file: File,
  preferredService: "storacha" | "pinata" = "pinata", // Default to Pinata since it's simpler
  email?: string
): Promise<IPFSUploadResult> {
  let lastError: Error | null = null
  
  // Check if Pinata is configured (JWT token or legacy API key/secret)
  const hasPinata = !!(
    process.env.NEXT_PUBLIC_PINATA_JWT || 
    (process.env.NEXT_PUBLIC_PINATA_API_KEY && process.env.NEXT_PUBLIC_PINATA_API_SECRET)
  )
  
  // If preferred is Storacha but package isn't installed, or Pinata is configured, use Pinata
  if (preferredService === "storacha" && !hasPinata) {
    try {
      const result = await uploadToIPFSStoracha(file, email)
      // If result is null, Storacha package isn't installed
      if (result === null) {
        console.info("Storacha not available, trying Pinata...")
        if (hasPinata) {
          return await uploadToIPFSPinata(file)
        } else {
          throw new Error(
            "Storacha package not installed and Pinata not configured. " +
            "Please either: 1) Install @storacha/client, or 2) Configure Pinata API keys."
          )
        }
      }
      return result
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn("Storacha upload failed:", lastError.message)
      
      // Fallback to Pinata if configured
      if (hasPinata) {
        console.info("Falling back to Pinata...")
        return await uploadToIPFSPinata(file)
      }
      throw lastError
    }
  } else {
    // Use Pinata (either preferred or as fallback)
    try {
      return await uploadToIPFSPinata(file)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      console.warn("Pinata upload failed:", lastError.message)
      
      // If Pinata was preferred but failed, try Storacha as fallback
      if (preferredService === "pinata") {
        try {
          console.info("Falling back to Storacha...")
          const result = await uploadToIPFSStoracha(file, email)
          if (result === null) {
            throw new Error("Storacha package not installed")
          }
          return result
        } catch (fallbackError) {
          const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
          throw new Error(
            `Both IPFS services failed. Pinata: ${lastError.message}. Storacha: ${fallbackErrorMsg}. ` +
            `Please check your API credentials or try again later.`
          )
        }
      }
      throw lastError
    }
  }
}
