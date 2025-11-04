# 3D Garment Visualizer - Setup Instructions

This application transforms flat garment images (front and back views) into 3D visualizations showing front, side, and back views as if worn by an invisible person.

## Prerequisites

1. **Supabase Account**: Database is already configured
2. **Google Gemini API Key**: Required for AI image generation

## Configuration Steps

### 1. Get Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Environment Variables

Update the `.env.local` file with your credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## How to Use

1. **Select Garment Type**: Choose from t-shirt, shirt, jacket, hoodie, or dress
2. **Upload Front View**: Upload a clear image of the garment's front
3. **Upload Back View**: Upload a clear image of the garment's back
4. **Generate 3D Views**: Click the button to process and generate 3D visualizations

The AI will create:
- **Front View**: The garment as if worn by an invisible person (front perspective)
- **Side View**: The garment from a side angle showing depth and draping
- **Back View**: The garment as if worn by an invisible person (back perspective)

## Database Schema

The `garments` table stores:
- Garment type
- Original uploaded images (front and back)
- Generated 3D views (front, side, back)
- Processing status
- Timestamps

## API Route

The `/api/generate-views` endpoint:
- Accepts base64 encoded images
- Uses Google's Gemini 2.0 Flash model
- Generates three different perspectives
- Returns text descriptions or image URLs

## Tech Stack

- **Next.js 13**: React framework with App Router
- **Supabase**: Database and backend
- **Google Gemini AI**: Image generation and transformation
- **shadcn/ui**: UI components
- **Tailwind CSS**: Styling
- **TypeScript**: Type safety

## Notes

- The application uses the Gemini 2.0 Flash Experimental model
- Processing time depends on image complexity and API response time
- All garment data is stored in Supabase for history tracking
- The app is responsive and works on mobile devices

## Troubleshooting

**Build Errors**: Ensure all environment variables are set correctly

**API Errors**: Verify your Gemini API key is valid and has quota available

**Database Errors**: Check Supabase credentials and that RLS policies are active

## Production Deployment

1. Set environment variables in your hosting platform
2. Update Supabase URL and keys for production
3. Ensure Gemini API key has sufficient quota
4. Run `npm run build` to create production build
5. Deploy using your preferred platform (Vercel, Netlify, etc.)
