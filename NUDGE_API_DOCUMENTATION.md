# Nudge API Documentation

## Overview
This API allows users to create and manage "nudges" for events. A nudge is a notification or reminder that can be sent to users about an event.

---

## Nudge Object Data Model

```json
{
  "type": "nudge",
  "uid": 18,
  "title": "Nudge Title",
  "event_id": "ObjectId of the tagged event",
  "cover_image": "/uploads/image.jpg",
  "send_time": "2024-01-15T10:30:00Z",
  "description": "Detailed description of the nudge",
  "icon": "/uploads/icon.png",
  "invitation_line": "One line invitation text",
  "status": "scheduled|sent|draft",
  "created_at": "2024-01-10T08:00:00Z",
  "updated_at": "2024-01-10T08:00:00Z"
}
```

### Field Descriptions
| Field | Type | Description |
|-------|------|-------------|
| type | String | Type of document ("nudge") |
| uid | Integer | User ID who created the nudge |
| title | String | Title of the nudge |
| event_id | ObjectId | Reference to the tagged event |
| cover_image | String | Path to the cover image file |
| send_time | DateTime | Time at which the nudge should be sent |
| description | String | Detailed description of the nudge |
| icon | String | Path to the icon image file |
| invitation_line | String | One-line invitation text |
| status | String | Status of the nudge (scheduled, sent, draft) |
| created_at | DateTime | Creation timestamp |
| updated_at | DateTime | Last update timestamp |

---

## API Endpoints

### Table 1: Nudge API Endpoints

| Widget | Request Type | Base URL | API Endpoint | Payload | Description |
|--------|-------------|----------|--------------|---------|-------------|
| Nudge | GET | /api/v3/app | /nudges?id=:nudge_id | - | Gets a nudge by its unique id |
| Nudge | GET | /api/v3/app | /nudges?event_id=:event_id | - | Gets all nudges for a specific event |
| Nudge | GET | /api/v3/app | /nudges?type=latest&limit=5&page=1 | - | Gets nudges with pagination |
| Nudge | POST | /api/v3/app | /nudges | title, event_id, cover_image, send_time, description, icon, invitation_line | Creates a nudge and returns the Id |
| Nudge | PUT | /api/v3/app | /nudges/:id | Same as POST payload | Updates a nudge by its unique Id |
| Nudge | DELETE | /api/v3/app | /nudges/:id | - | Deletes a nudge based on its unique Id |

---

## Endpoint Details

### 1. GET /api/v3/app/nudges?id=:nudge_id

**Description:** Retrieves a specific nudge by its unique ID.

**Request:**
```
GET /api/v3/app/nudges?id=<nudge_id>
```

**Response:**
```json
{
  "_id": "65a1234567890abcdef1234",
  "type": "nudge",
  "uid": 18,
  "title": "Event Reminder",
  "event_id": "65a1234567890abcdef1235",
  "cover_image": "/uploads/cover123.jpg",
  "send_time": "2024-01-15T10:30:00Z",
  "description": "Don't forget to attend the event!",
  "icon": "/uploads/icon123.png",
  "invitation_line": "Join us for an amazing event!",
  "status": "scheduled",
  "created_at": "2024-01-10T08:00:00Z",
  "updated_at": "2024-01-10T08:00:00Z"
}
```

**Status Codes:**
- 200: Success
- 400: Invalid nudge ID
- 404: Nudge not found

---

### 2. GET /api/v3/app/nudges?event_id=:event_id

**Description:** Retrieves all nudges associated with a specific event.

**Request:**
```
GET /api/v3/app/nudges?event_id=<event_id>
```

**Response:**
```json
{
  "nudges": [
    {
      "_id": "65a1234567890abcdef1234",
      "type": "nudge",
      "uid": 18,
      "title": "Event Reminder",
      "event_id": "65a1234567890abcdef1235",
      "cover_image": "/uploads/cover123.jpg",
      "send_time": "2024-01-15T10:30:00Z",
      "description": "Don't forget to attend the event!",
      "icon": "/uploads/icon123.png",
      "invitation_line": "Join us for an amazing event!",
      "status": "scheduled"
    },
    {
      "_id": "65a1234567890abcdef1236",
      "type": "nudge",
      "uid": 18,
      "title": "Last Chance",
      "event_id": "65a1234567890abcdef1235",
      "cover_image": "/uploads/cover456.jpg",
      "send_time": "2024-01-14T18:00:00Z",
      "description": "Last chance to register!",
      "icon": "/uploads/icon456.png",
      "invitation_line": "Only a few spots left!",
      "status": "sent"
    }
  ],
  "total": 2
}
```

**Status Codes:**
- 200: Success
- 400: Invalid event ID
- 404: Event not found

---

### 3. GET /api/v3/app/nudges?type=latest&limit=5&page=1

**Description:** Retrieves paginated list of latest nudges.

**Request:**
```
GET /api/v3/app/nudges?type=latest&limit=10&page=1
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| type | String | No | - | Set to "latest" to enable pagination |
| limit | Integer | No | 10 | Number of nudges per page |
| page | Integer | No | 1 | Page number |

**Response:**
```json
{
  "nudges": [
    {
      "_id": "65a1234567890abcdef1234",
      "type": "nudge",
      "uid": 18,
      "title": "Event Reminder",
      "event_id": "65a1234567890abcdef1235",
      "cover_image": "/uploads/cover123.jpg",
      "send_time": "2024-01-15T10:30:00Z",
      "description": "Don't forget to attend the event!",
      "icon": "/uploads/icon123.png",
      "invitation_line": "Join us for an amazing event!",
      "status": "scheduled"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalNudges": 50,
    "limit": 10
  }
}
```

**Status Codes:**
- 200: Success
- 500: Internal server error

---

### 4. POST /api/v3/app/nudges

**Description:** Creates a new nudge for an event.

**Request:**
```
POST /api/v3/app/nudges
Content-Type: multipart/form-data
```

**Payload (multipart/form-data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | String | Yes | Title of the nudge |
| event_id | String | Yes | ID of the tagged event |
| cover_image | File | No | Cover image file |
| send_time | DateTime | Yes | Time to send the nudge |
| description | String | Yes | Detailed description |
| icon | File | No | Icon image file |
| invitation_line | String | Yes | One-line invitation text |

**Example Request (cURL):**
```bash
curl -X POST http://localhost:3000/api/v3/app/nudges \
  -F "title=Event Reminder" \
  -F "event_id=65a1234567890abcdef1235" \
  -F "send_time=2024-01-15T10:30:00Z" \
  -F "description=Don't forget to attend the event!" \
  -F "invitation_line=Join us for an amazing event!" \
  -F "cover_image=@/path/to/cover.jpg" \
  -F "icon=@/path/to/icon.png"
```

**Response:**
```json
{
  "message": "Nudge created successfully",
  "nudge_id": "65a1234567890abcdef1234"
}
```

**Status Codes:**
- 201: Created successfully
- 400: Bad request (missing required fields)
- 500: Internal server error

---

### 5. PUT /api/v3/app/nudges/:id

**Description:** Updates an existing nudge by its unique ID.

**Request:**
```
PUT /api/v3/app/nudges/:id
Content-Type: multipart/form-data
```

**Payload (multipart/form-data):**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | String | No | Updated title |
| event_id | String | No | Updated event ID |
| cover_image | File | No | New cover image file |
| send_time | DateTime | No | Updated send time |
| description | String | No | Updated description |
| icon | File | No | New icon image file |
| invitation_line | String | No | Updated invitation line |
| status | String | No | Updated status (scheduled, sent, draft) |

**Example Request (cURL):**
```bash
curl -X PUT http://localhost:3000/api/v3/app/nudges/65a1234567890abcdef1234 \
  -F "title=Updated Event Reminder" \
  -F "description=Updated description of the nudge!"
```

**Response:**
```json
{
  "message": "Nudge updated successfully",
  "nudge_id": "65a1234567890abcdef1234"
}
```

**Status Codes:**
- 200: Updated successfully
- 400: Bad request or invalid ID
- 404: Nudge not found
- 500: Internal server error

---

### 6. DELETE /api/v3/app/nudges/:id

**Description:** Deletes a nudge by its unique ID.

**Request:**
```
DELETE /api/v3/app/nudges/:id
```

**Example Request (cURL):**
```bash
curl -X DELETE http://localhost:3000/api/v3/app/nudges/65a1234567890abcdef1234
```

**Response:**
```json
{
  "message": "Nudge deleted successfully",
  "nudge_id": "65a1234567890abcdef1234"
}
```

**Status Codes:**
- 200: Deleted successfully
- 400: Invalid ID
- 404: Nudge not found
- 500: Internal server error

---

## Error Response Format

All error responses follow this format:

```json
{
  "error": "Error message description"
}
```

---

## Status Values

The `status` field can have the following values:
| Status | Description |
|--------|-------------|
| draft | Nudge is saved but not scheduled |
| scheduled | Nudge is scheduled to be sent |
| sent | Nudge has been sent |

---

## Implementation Notes

1. **Schema-less Design:** This API uses MongoDB's native driver without Mongoose schemas, allowing flexibility to add or remove fields as needed.

2. **File Uploads:** Both cover_image and icon are optional file uploads handled by Multer middleware.

3. **Pagination:** The pagination uses skip/limit approach for efficient data retrieval.

4. **Authentication:** This API assumes user authentication is handled at the application level and uses the `uid` field to track the creator.

5. **Validation:** Basic validation is implemented for required fields and ObjectId formats.
