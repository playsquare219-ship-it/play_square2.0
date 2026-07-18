import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/server/auth/jwt'

/**
 * Generate a PDF with booking/match details
 * This is a simple implementation that returns HTML that can be converted to PDF client-side
 * or using a service like html2pdf
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('playSquareToken')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await request.json()
    const {
      matchId,
      stadium,
      dateTime,
      team1Name,
      team2Name,
      wilaya,
      commune,
      bookingReference,
      organizer,
      invitee,
    } = body

    if (!matchId || !stadium || !dateTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Parse the date
    const matchDate = new Date(dateTime)
    const formattedDate = matchDate.toLocaleDateString('ar-DZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    })
    const formattedTime = matchDate.toLocaleTimeString('ar-DZ', {
      hour: '2-digit',
      minute: '2-digit',
    })

    // Generate HTML for PDF
    const htmlContent = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تفاصيل المباراة</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            padding: 20px;
            color: #333;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #e8003d 0%, #c70030 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
            font-weight: bold;
        }
        
        .header p {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .content {
            padding: 30px;
        }
        
        .section {
            margin-bottom: 30px;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #e8003d;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #f0f0f0;
        }
        
        .match-details {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .detail-item {
            padding: 15px;
            background: #f9f9f9;
            border-radius: 8px;
            border-right: 3px solid #e8003d;
        }
        
        .detail-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        .detail-value {
            font-size: 16px;
            color: #333;
            font-weight: bold;
        }
        
        .teams {
            display: grid;
            grid-template-columns: 1fr auto 1fr;
            gap: 20px;
            align-items: center;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .team {
            text-align: center;
        }
        
        .team-name {
            font-size: 16px;
            font-weight: bold;
            color: #333;
        }
        
        .vs {
            font-size: 24px;
            color: #e8003d;
            font-weight: bold;
        }
        
        .participants {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .participant {
            padding: 15px;
            background: #f9f9f9;
            border-radius: 8px;
        }
        
        .participant-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 8px;
            font-weight: bold;
        }
        
        .participant-name {
            font-size: 14px;
            color: #333;
            font-weight: bold;
        }
        
        .booking-reference {
            background: #f0f0f0;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin-top: 20px;
        }
        
        .booking-ref-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-bottom: 8px;
            font-weight: bold;
        }
        
        .booking-ref-value {
            font-size: 18px;
            font-weight: bold;
            color: #e8003d;
            font-family: 'Courier New', monospace;
            letter-spacing: 2px;
        }
        
        .footer {
            background: #f9f9f9;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #e0e0e0;
        }
        
        .footer-date {
            margin-bottom: 10px;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .container {
                box-shadow: none;
                border-radius: 0;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏟️ تفاصيل المباراة</h1>
            <p>Play Square - حجز الملاعب</p>
        </div>
        
        <div class="content">
            <!-- Match Details Section -->
            <div class="section">
                <div class="section-title">تفاصيل المباراة</div>
                <div class="match-details">
                    <div class="detail-item">
                        <div class="detail-label">التاريخ</div>
                        <div class="detail-value">${formattedDate}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">التوقيت</div>
                        <div class="detail-value">${formattedTime}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">الملعب</div>
                        <div class="detail-value">${stadium}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">الموقع</div>
                        <div class="detail-value">${wilaya || ''} - ${commune || ''}</div>
                    </div>
                </div>
            </div>
            
            <!-- Teams Section -->
            ${team1Name && team2Name ? `
            <div class="section">
                <div class="section-title">الفريقان</div>
                <div class="teams">
                    <div class="team">
                        <div class="team-name">${team1Name}</div>
                    </div>
                    <div class="vs">VS</div>
                    <div class="team">
                        <div class="team-name">${team2Name}</div>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <!-- Participants Section -->
            ${organizer || invitee ? `
            <div class="section">
                <div class="section-title">المشاركون</div>
                <div class="participants">
                    ${organizer ? `
                    <div class="participant">
                        <div class="participant-label">منظم المباراة</div>
                        <div class="participant-name">${organizer}</div>
                    </div>
                    ` : ''}
                    ${invitee ? `
                    <div class="participant">
                        <div class="participant-label">الضيف</div>
                        <div class="participant-name">${invitee}</div>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}
            
            <!-- Booking Reference -->
            ${bookingReference ? `
            <div class="section">
                <div class="booking-reference">
                    <div class="booking-ref-label">رقم الحجز</div>
                    <div class="booking-ref-value">${bookingReference}</div>
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <div class="footer-date">تم الطباعة في: ${new Date().toLocaleString('ar-DZ')}</div>
            <p>يرجى الوصول في الوقت المحدد قبل 15 دقيقة</p>
        </div>
    </div>
</body>
</html>
    `

    // Return the HTML content with appropriate headers
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="booking-${matchId}.html"`,
      },
    })
  } catch (error) {
    console.error('[API /generate-booking-pdf] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET endpoint to generate PDF preview
 */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('playSquareToken')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')
    const stadium = searchParams.get('stadium')
    const dateTime = searchParams.get('dateTime')
    const team1Name = searchParams.get('team1Name')
    const team2Name = searchParams.get('team2Name')
    const wilaya = searchParams.get('wilaya')
    const commune = searchParams.get('commune')
    const bookingReference = searchParams.get('bookingReference')
    const organizer = searchParams.get('organizer')
    const invitee = searchParams.get('invitee')

    if (!matchId || !stadium || !dateTime) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Create request body from query parameters
    const body = {
      matchId,
      stadium,
      dateTime,
      team1Name,
      team2Name,
      wilaya,
      commune,
      bookingReference,
      organizer,
      invitee,
    }

    // Call the POST handler logic
    const postRequest = new NextRequest(request, {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return POST(postRequest)
  } catch (error) {
    console.error('[API /generate-booking-pdf GET] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
