/**
 * Icon Library - Professional SVG Icons
 * Fixed and expanded collection similar to lucide-react icon set
 */

import {
    createIcons,
    pathToIconNode,
    circleToIconNode,
    lineToIconNode,
    rectToIconNode,
    polylineToIconNode,
    polygonToIconNode,
    ellipseToIconNode,
    type IconDefinition,
} from './Icon';

/**
 * Icon Definitions
 */
export const iconDefinitions: Record<string, IconDefinition> = {
    // UI & Navigation Icons
    Home: [
        pathToIconNode('M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'),
        polylineToIconNode('9 22 9 12 15 12 15 22'),
    ],

    Menu: [
        lineToIconNode(4, 12, 20, 12),
        lineToIconNode(4, 6, 20, 6),
        lineToIconNode(4, 18, 20, 18),
    ],

    X: [
        lineToIconNode(18, 6, 6, 18),
        lineToIconNode(6, 6, 18, 18),
    ],

    ChevronDown: [
        polylineToIconNode('6 9 12 15 18 9'),
    ],

    ChevronUp: [
        polylineToIconNode('18 15 12 9 6 15'),
    ],

    ChevronLeft: [
        polylineToIconNode('15 18 9 12 15 6'),
    ],

    ChevronRight: [
        polylineToIconNode('9 18 15 12 9 6'),
    ],

    ChevronsDown: [
        polylineToIconNode('7 13 12 18 17 13'),
        polylineToIconNode('7 6 12 11 17 6'),
    ],

    ChevronsUp: [
        polylineToIconNode('17 11 12 6 7 11'),
        polylineToIconNode('17 18 12 13 7 18'),
    ],

    ChevronsLeft: [
        polylineToIconNode('11 17 6 12 11 7'),
        polylineToIconNode('18 17 13 12 18 7'),
    ],

    ChevronsRight: [
        polylineToIconNode('13 17 18 12 13 7'),
        polylineToIconNode('6 17 11 12 6 7'),
    ],

    ArrowLeft: [
        lineToIconNode(19, 12, 5, 12),
        polylineToIconNode('12 19 5 12 12 5'),
    ],

    ArrowRight: [
        lineToIconNode(5, 12, 19, 12),
        polylineToIconNode('12 5 19 12 12 19'),
    ],

    ArrowUp: [
        lineToIconNode(12, 19, 12, 5),
        polylineToIconNode('5 12 12 5 19 12'),
    ],

    ArrowDown: [
        lineToIconNode(12, 5, 12, 19),
        polylineToIconNode('19 12 12 19 5 12'),
    ],

    ArrowUpRight: [
        lineToIconNode(7, 17, 17, 7),
        polylineToIconNode('7 7 17 7 17 17'),
    ],

    ArrowDownRight: [
        lineToIconNode(7, 7, 17, 17),
        polylineToIconNode('17 7 17 17 7 17'),
    ],

    ArrowUpLeft: [
        lineToIconNode(17, 17, 7, 7),
        polylineToIconNode('17 7 7 7 7 17'),
    ],

    ArrowDownLeft: [
        lineToIconNode(17, 7, 7, 17),
        polylineToIconNode('7 7 7 17 17 17'),
    ],

    // Actions
    Plus: [
        lineToIconNode(12, 5, 12, 19),
        lineToIconNode(5, 12, 19, 12),
    ],

    Minus: [
        lineToIconNode(5, 12, 19, 12),
    ],

    Check: [
        polylineToIconNode('20 6 9 17 4 12'),
    ],

    Search: [
        circleToIconNode(11, 11, 8),
        pathToIconNode('m21 21-4.35-4.35'),
    ],

    Settings: [
        pathToIconNode('M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z'),
        circleToIconNode(12, 12, 3),
    ],

    MoreVertical: [
        circleToIconNode(12, 12, 1),
        circleToIconNode(12, 5, 1),
        circleToIconNode(12, 19, 1),
    ],

    MoreHorizontal: [
        circleToIconNode(12, 12, 1),
        circleToIconNode(5, 12, 1),
        circleToIconNode(19, 12, 1),
    ],

    Edit: [
        pathToIconNode('M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7'),
        pathToIconNode('M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z'),
    ],

    Edit2: [
        pathToIconNode('M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z'),
    ],

    Edit3: [
        pathToIconNode('M12 20h9'),
        pathToIconNode('M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z'),
    ],

    Trash: [
        polylineToIconNode('3 6 5 6 21 6'),
        pathToIconNode('M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'),
    ],

    Trash2: [
        polylineToIconNode('3 6 5 6 21 6'),
        pathToIconNode('M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2'),
        lineToIconNode(10, 11, 10, 17),
        lineToIconNode(14, 11, 14, 17),
    ],

    Copy: [
        rectToIconNode(9, 9, 13, 13, { rx: 2 }),
        pathToIconNode('M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'),
    ],

    Download: [
        pathToIconNode('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'),
        polylineToIconNode('7 10 12 15 17 10'),
        lineToIconNode(12, 15, 12, 3),
    ],

    Upload: [
        pathToIconNode('M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4'),
        polylineToIconNode('17 8 12 3 7 8'),
        lineToIconNode(12, 3, 12, 15),
    ],

    Save: [
        pathToIconNode('M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z'),
        polylineToIconNode('17 21 17 13 7 13 7 21'),
        polylineToIconNode('7 3 7 8 15 8'),
    ],

    Refresh: [
        polylineToIconNode('23 4 23 10 17 10'),
        polylineToIconNode('1 20 1 14 7 14'),
        pathToIconNode('M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'),
    ],

    RefreshCw: [
        polylineToIconNode('23 4 23 10 17 10'),
        polylineToIconNode('1 20 1 14 7 14'),
        pathToIconNode('M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'),
    ],

    RotateCw: [
        polylineToIconNode('23 4 23 10 17 10'),
        pathToIconNode('M20.49 15a9 9 0 1 1-2.12-9.36L23 10'),
    ],

    RotateCcw: [
        polylineToIconNode('1 4 1 10 7 10'),
        pathToIconNode('M3.51 15a9 9 0 1 0 2.13-9.36L1 10'),
    ],

    // Files & Documents
    File: [
        pathToIconNode('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'),
        polylineToIconNode('14 2 14 8 20 8'),
    ],

    FileText: [
        pathToIconNode('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'),
        polylineToIconNode('14 2 14 8 20 8'),
        lineToIconNode(16, 13, 8, 13),
        lineToIconNode(16, 17, 8, 17),
        lineToIconNode(10, 9, 8, 9),
    ],

    FilePlus: [
        pathToIconNode('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'),
        polylineToIconNode('14 2 14 8 20 8'),
        lineToIconNode(12, 18, 12, 12),
        lineToIconNode(9, 15, 15, 15),
    ],

    FileMinus: [
        pathToIconNode('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'),
        polylineToIconNode('14 2 14 8 20 8'),
        lineToIconNode(9, 15, 15, 15),
    ],

    FileCode: [
        pathToIconNode('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'),
        polylineToIconNode('14 2 14 8 20 8'),
        polylineToIconNode('10 13 8 15 10 17'),
        polylineToIconNode('14 13 16 15 14 17'),
    ],

    FileSearch: [
        pathToIconNode('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'),
        polylineToIconNode('14 2 14 8 20 8'),
        circleToIconNode(11, 14, 3),
        lineToIconNode(13.5, 16.5, 15, 18),
    ],

    FileLock: [
        pathToIconNode('M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z'),
        polylineToIconNode('14 2 14 8 20 8'),
        rectToIconNode(9, 13, 6, 4, { rx: 1 }),
        pathToIconNode('M10 13v-1a2 2 0 1 1 4 0v1'),
    ],

    Slack: [
        rectToIconNode(13, 2, 3, 8, { rx: 1.5 }),
        pathToIconNode('M19 8.5V10h-1.5A1.5 1.5 0 1 1 19 8.5z'),
        rectToIconNode(14, 13, 8, 3, { rx: 1.5 }),
        pathToIconNode('M15.5 19H14v1.5a1.5 1.5 0 1 0 1.5-1.5z'),
        rectToIconNode(8, 14, 3, 8, { rx: 1.5 }),
        pathToIconNode('M5 15.5V14h1.5A1.5 1.5 0 1 0 5 15.5z'),
        rectToIconNode(2, 8, 8, 3, { rx: 1.5 }),
        pathToIconNode('M8.5 5H10V3.5a1.5 1.5 0 1 0-1.5 1.5z'),
    ],

    Folder: [
        pathToIconNode('M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'),
    ],

    FolderOpen: [
        pathToIconNode('M2 17a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2z'),
        pathToIconNode('m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4'),
    ],

    FolderPlus: [
        pathToIconNode('M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'),
        lineToIconNode(12, 11, 12, 17),
        lineToIconNode(9, 14, 15, 14),
    ],

    FolderMinus: [
        pathToIconNode('M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'),
        lineToIconNode(9, 14, 15, 14),
    ],

    FolderSearch: [
        pathToIconNode('M11 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v4'),
        circleToIconNode(17, 17, 3),
        lineToIconNode(19, 19, 21, 21),
    ],

    FolderLock: [
        pathToIconNode('M11 20H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H20a2 2 0 0 1 2 2v2'),
        rectToIconNode(15, 15, 6, 4, { rx: 1 }),
        pathToIconNode('M16 15v-1a2 2 0 1 1 4 0v1'),
    ],

    FolderHeart: [
        pathToIconNode('M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z'),
        pathToIconNode('M12 18.15l-.45-.41C9.9 16.35 8.5 15.19 8.5 13.8a1.86 1.86 0 0 1 1.9-1.9c.7 0 1.36.32 1.6.82a1.84 1.84 0 0 1 1.6-.82 1.86 1.86 0 0 1 1.9 1.9c0 1.39-1.4 2.55-3.05 3.94l-.45.41z'),
    ],

    // Communication
    Mail: [
        pathToIconNode('M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'),
        polylineToIconNode('22 6 12 13 2 6'),
    ],

    MessageSquare: [
        pathToIconNode('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'),
    ],

    MessageCircle: [
        pathToIconNode('M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z'),
    ],

    Send: [
        lineToIconNode(22, 2, 11, 13),
        polygonToIconNode('22 2 15 22 11 13 2 9 22 2'),
    ],

    Bell: [
        pathToIconNode('M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9'),
        pathToIconNode('M13.73 21a2 2 0 0 1-3.46 0'),
    ],

    BellOff: [
        pathToIconNode('M13.73 21a2 2 0 0 1-3.46 0'),
        pathToIconNode('M18.63 13A17.89 17.89 0 0 1 18 8'),
        pathToIconNode('M6.26 6.26A5.86 5.86 0 0 0 6 8c0 7-3 9-3 9h14'),
        pathToIconNode('M18 8a6 6 0 0 0-9.33-5'),
        lineToIconNode(1, 1, 23, 23),
    ],

    BellRing: [
        pathToIconNode('M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9'),
        pathToIconNode('M10.3 21a1.94 1.94 0 0 0 3.4 0'),
        pathToIconNode('M4 2C2.8 3.7 2 5.7 2 8'),
        pathToIconNode('M22 8c0-2.3-.8-4.3-2-6'),
    ],

    Inbox: [
        polylineToIconNode('22 12 16 12 14 15 10 15 8 12 2 12'),
        pathToIconNode('M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'),
    ],

    AtSign: [
        circleToIconNode(12, 12, 4),
        pathToIconNode('M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94'),
    ],

    Phone: [
        pathToIconNode('M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'),
    ],

    PhoneCall: [
        pathToIconNode('M15.05 5A5 5 0 0 1 19 8.95M15.05 1A9 9 0 0 1 23 8.94m-1 7.98v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'),
    ],

    PhoneOff: [
        pathToIconNode('M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91'),
        lineToIconNode(1, 1, 23, 23),
    ],

    // Media
    Image: [
        rectToIconNode(3, 3, 18, 18, { rx: 2 }),
        circleToIconNode(8.5, 8.5, 1.5),
        polylineToIconNode('21 15 16 10 5 21'),
    ],

    Video: [
        polygonToIconNode('23 7 16 12 23 17 23 7'),
        rectToIconNode(1, 5, 15, 14, { rx: 2 }),
    ],

    Music: [
        pathToIconNode('M9 18V5l12-2v13'),
        circleToIconNode(6, 18, 3),
        circleToIconNode(18, 16, 3),
    ],

    Play: [
        polygonToIconNode('5 3 19 12 5 21 5 3'),
    ],

    Pause: [
        rectToIconNode(6, 4, 4, 16),
        rectToIconNode(14, 4, 4, 16),
    ],

    Square: [
        rectToIconNode(3, 3, 18, 18, { rx: 2 }),
    ],

    SkipBack: [
        polygonToIconNode('19 20 9 12 19 4 19 20'),
        lineToIconNode(5, 19, 5, 5),
    ],

    SkipForward: [
        polygonToIconNode('5 4 15 12 5 20 5 4'),
        lineToIconNode(19, 5, 19, 19),
    ],

    FastForward: [
        polygonToIconNode('13 19 22 12 13 5 13 19'),
        polygonToIconNode('2 19 11 12 2 5 2 19'),
    ],

    Rewind: [
        polygonToIconNode('11 19 2 12 11 5 11 19'),
        polygonToIconNode('22 19 13 12 22 5 22 19'),
    ],

    Volume: [
        polygonToIconNode('11 5 6 9 2 9 2 15 6 15 11 19 11 5'),
    ],

    Volume1: [
        polygonToIconNode('11 5 6 9 2 9 2 15 6 15 11 19 11 5'),
        pathToIconNode('M15.54 8.46a5 5 0 0 1 0 7.07'),
    ],

    Volume2: [
        polygonToIconNode('11 5 6 9 2 9 2 15 6 15 11 19 11 5'),
        pathToIconNode('M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07'),
    ],

    VolumeX: [
        polygonToIconNode('11 5 6 9 2 9 2 15 6 15 11 19 11 5'),
        lineToIconNode(23, 9, 17, 15),
        lineToIconNode(17, 9, 23, 15),
    ],

    // User & Profile
    User: [
        pathToIconNode('M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'),
        circleToIconNode(12, 7, 4),
    ],

    Users: [
        pathToIconNode('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'),
        circleToIconNode(9, 7, 4),
        pathToIconNode('M23 21v-2a4 4 0 0 0-3-3.87'),
        pathToIconNode('M16 3.13a4 4 0 0 1 0 7.75'),
    ],

    UserPlus: [
        pathToIconNode('M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'),
        circleToIconNode(8.5, 7, 4),
        lineToIconNode(20, 8, 20, 14),
        lineToIconNode(23, 11, 17, 11),
    ],

    UserMinus: [
        pathToIconNode('M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'),
        circleToIconNode(8.5, 7, 4),
        lineToIconNode(23, 11, 17, 11),
    ],

    UserCheck: [
        pathToIconNode('M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'),
        circleToIconNode(8.5, 7, 4),
        polylineToIconNode('17 11 19 13 23 9'),
    ],

    UserX: [
        pathToIconNode('M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'),
        circleToIconNode(8.5, 7, 4),
        lineToIconNode(18, 8, 23, 13),
        lineToIconNode(23, 8, 18, 13),
    ],

    UserSearch: [
        pathToIconNode('M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'),
        circleToIconNode(8.5, 7, 4),
        circleToIconNode(18, 10, 3),
        lineToIconNode(21, 13, 23, 15),
    ],

    Heart: [
        pathToIconNode('M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'),
    ],

    Star: [
        polygonToIconNode('12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2'),
    ],

    // Status & Alerts
    AlertCircle: [
        circleToIconNode(12, 12, 10),
        lineToIconNode(12, 8, 12, 12),
        lineToIconNode(12, 16, 12.01, 16),
    ],

    AlertTriangle: [
        pathToIconNode('m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3z'),
        lineToIconNode(12, 9, 12, 13),
        lineToIconNode(12, 17, 12.01, 17),
    ],

    Info: [
        circleToIconNode(12, 12, 10),
        lineToIconNode(12, 16, 12, 12),
        lineToIconNode(12, 8, 12.01, 8),
    ],

    CheckCircle: [
        pathToIconNode('M22 11.08V12a10 10 0 1 1-5.93-9.14'),
        polylineToIconNode('22 4 12 14.01 9 11.01'),
    ],

    CheckCircle2: [
        pathToIconNode('M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z'),
        pathToIconNode('m9 12 2 2 4-4'),
    ],

    XCircle: [
        circleToIconNode(12, 12, 10),
        lineToIconNode(15, 9, 9, 15),
        lineToIconNode(9, 9, 15, 15),
    ],

    HelpCircle: [
        circleToIconNode(12, 12, 10),
        pathToIconNode('M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3'),
        lineToIconNode(12, 17, 12.01, 17),
    ],

    // Time & Calendar
    Clock: [
        circleToIconNode(12, 12, 10),
        polylineToIconNode('12 6 12 12 16 14'),
    ],

    Calendar: [
        rectToIconNode(3, 4, 18, 18, { rx: 2 }),
        lineToIconNode(16, 2, 16, 6),
        lineToIconNode(8, 2, 8, 6),
        lineToIconNode(3, 10, 21, 10),
    ],

    Timer: [
        lineToIconNode(10, 2, 14, 2),
        lineToIconNode(12, 14, 15, 11),
        circleToIconNode(12, 14, 8),
    ],

    History: [
        pathToIconNode('M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8'),
        polylineToIconNode('3 3 3 8 8 8'),
        polylineToIconNode('12 7 12 12 15 15'),
    ],

    // Lock & Security
    Lock: [
        rectToIconNode(3, 11, 18, 11, { rx: 2 }),
        pathToIconNode('M7 11V7a5 5 0 0 1 10 0v4'),
    ],

    Unlock: [
        rectToIconNode(3, 11, 18, 11, { rx: 2 }),
        pathToIconNode('M7 11V7a5 5 0 0 1 9.9-1'),
    ],

    Eye: [
        pathToIconNode('M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z'),
        circleToIconNode(12, 12, 3),
    ],

    EyeOff: [
        pathToIconNode('M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24'),
        lineToIconNode(1, 1, 23, 23),
    ],

    Shield: [
        pathToIconNode('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'),
    ],

    ShieldCheck: [
        pathToIconNode('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'),
        polylineToIconNode('9 12 11 14 15 10'),
    ],

    ShieldAlert: [
        pathToIconNode('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'),
        lineToIconNode(12, 9, 12, 13),
        lineToIconNode(12, 17, 12.01, 17),
    ],

    ShieldOff: [
        pathToIconNode('M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18'),
        pathToIconNode('M4.73 4.73 4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38'),
        lineToIconNode(1, 1, 23, 23),
    ],

    Key: [
        pathToIconNode('m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4'),
    ],

    // Shopping & Commerce
    ShoppingCart: [
        circleToIconNode(9, 21, 1),
        circleToIconNode(20, 21, 1),
        pathToIconNode('M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6'),
    ],

    ShoppingBag: [
        pathToIconNode('M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z'),
        lineToIconNode(3, 6, 21, 6),
        pathToIconNode('M16 10a4 4 0 0 1-8 0'),
    ],

    CreditCard: [
        rectToIconNode(1, 4, 22, 16, { rx: 2 }),
        lineToIconNode(1, 10, 23, 10),
    ],

    DollarSign: [
        lineToIconNode(12, 1, 12, 23),
        pathToIconNode('M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'),
    ],

    Tag: [
        pathToIconNode('M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z'),
        lineToIconNode(7, 7, 7.01, 7),
    ],

    Gift: [
        polylineToIconNode('20 12 20 22 4 22 4 12'),
        rectToIconNode(2, 7, 20, 5),
        lineToIconNode(12, 22, 12, 7),
        pathToIconNode('M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z'),
        pathToIconNode('M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z'),
    ],

    Package: [
        lineToIconNode(16.5, 9.4, 7.5, 4.21),
        pathToIconNode('M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'),
        polylineToIconNode('3.27 6.96 12 12.01 20.73 6.96'),
        lineToIconNode(12, 22.08, 12, 12),
    ],

    // Development
    Code: [
        polylineToIconNode('16 18 22 12 16 6'),
        polylineToIconNode('8 6 2 12 8 18'),
    ],

    Code2: [
        pathToIconNode('m18 16 4-4-4-4'),
        pathToIconNode('m6 8-4 4 4 4'),
        pathToIconNode('m14.5 4-5 16'),
    ],

    Terminal: [
        polylineToIconNode('4 17 10 11 4 5'),
        lineToIconNode(12, 19, 20, 19),
    ],

    Command: [
        pathToIconNode('M18 3a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3H6a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 3 3 0 0 0-3-3z'),
    ],

    GitBranch: [
        lineToIconNode(6, 3, 6, 15),
        circleToIconNode(18, 6, 3),
        circleToIconNode(6, 18, 3),
        pathToIconNode('M18 9a9 9 0 0 1-9 9'),
    ],

    GitCommit: [
        circleToIconNode(12, 12, 4),
        lineToIconNode(1.05, 12, 7, 12),
        lineToIconNode(17.01, 12, 22.96, 12),
    ],

    GitMerge: [
        circleToIconNode(18, 18, 3),
        circleToIconNode(6, 6, 3),
        pathToIconNode('M6 21V9a9 9 0 0 0 9 9'),
    ],

    GitPullRequest: [
        circleToIconNode(18, 18, 3),
        circleToIconNode(6, 6, 3),
        pathToIconNode('M13 6h3a2 2 0 0 1 2 2v7'),
        lineToIconNode(6, 9, 6, 21),
    ],

    Github: [
        pathToIconNode('M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22'),
    ],

    // Weather
    Sun: [
        circleToIconNode(12, 12, 4),
        pathToIconNode('M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42'),
    ],

    Moon: [
        pathToIconNode('M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z'),
    ],

    Cloud: [
        pathToIconNode('M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z'),
    ],

    CloudRain: [
        lineToIconNode(16, 13, 16, 21),
        lineToIconNode(8, 13, 8, 21),
        lineToIconNode(12, 15, 12, 23),
        pathToIconNode('M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25'),
    ],

    CloudSnow: [
        pathToIconNode('M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25'),
        lineToIconNode(8, 16, 8.01, 16),
        lineToIconNode(8, 20, 8.01, 20),
        lineToIconNode(12, 18, 12.01, 18),
        lineToIconNode(12, 22, 12.01, 22),
        lineToIconNode(16, 16, 16.01, 16),
        lineToIconNode(16, 20, 16.01, 20),
    ],

    CloudLightning: [
        pathToIconNode('M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 9'),
        polylineToIconNode('13 11 9 17 15 17 11 23'),
    ],

    Zap: [
        polygonToIconNode('13 2 3 14 12 14 11 22 21 10 12 10 13 2'),
    ],

    // Misc
    Bookmark: [
        pathToIconNode('M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z'),
    ],

    Flag: [
        pathToIconNode('M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z'),
        lineToIconNode(4, 22, 4, 15),
    ],

    Share: [
        circleToIconNode(18, 5, 3),
        circleToIconNode(6, 12, 3),
        circleToIconNode(18, 19, 3),
        lineToIconNode(8.59, 13.51, 15.42, 17.49),
        lineToIconNode(15.41, 6.51, 8.59, 10.49),
    ],

    Share2: [
        circleToIconNode(18, 5, 3),
        circleToIconNode(6, 12, 3),
        circleToIconNode(18, 19, 3),
        lineToIconNode(8.59, 13.51, 15.42, 17.49),
        lineToIconNode(15.41, 6.51, 8.59, 10.49),
    ],

    Link: [
        pathToIconNode('M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71'),
        pathToIconNode('M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'),
    ],

    Link2: [
        pathToIconNode('M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3'),
        lineToIconNode(8, 12, 16, 12),
    ],

    ExternalLink: [
        pathToIconNode('M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6'),
        polylineToIconNode('15 3 21 3 21 9'),
        lineToIconNode(10, 14, 21, 3),
    ],

    Loader: [
        lineToIconNode(12, 2, 12, 6),
        lineToIconNode(12, 18, 12, 22),
        lineToIconNode(4.93, 4.93, 7.76, 7.76),
        lineToIconNode(16.24, 16.24, 19.07, 19.07),
        lineToIconNode(2, 12, 6, 12),
        lineToIconNode(18, 12, 22, 12),
        lineToIconNode(4.93, 19.07, 7.76, 16.24),
        lineToIconNode(16.24, 7.76, 19.07, 4.93),
    ],

    Loader2: [
        pathToIconNode('M21 12a9 9 0 1 1-6.219-8.56'),
    ],

    // Layout & Design
    Layout: [
        rectToIconNode(3, 3, 18, 18, { rx: 2 }),
        lineToIconNode(3, 9, 21, 9),
        lineToIconNode(9, 21, 9, 9),
    ],

    Grid: [
        rectToIconNode(3, 3, 7, 7),
        rectToIconNode(14, 3, 7, 7),
        rectToIconNode(14, 14, 7, 7),
        rectToIconNode(3, 14, 7, 7),
    ],

    Grid3x3: [
        rectToIconNode(3, 3, 5, 5, { rx: 1 }),
        rectToIconNode(10, 3, 5, 5, { rx: 1 }),
        rectToIconNode(17, 3, 5, 5, { rx: 1 }),
        rectToIconNode(3, 10, 5, 5, { rx: 1 }),
        rectToIconNode(10, 10, 5, 5, { rx: 1 }),
        rectToIconNode(17, 10, 5, 5, { rx: 1 }),
        rectToIconNode(3, 17, 5, 5, { rx: 1 }),
        rectToIconNode(10, 17, 5, 5, { rx: 1 }),
        rectToIconNode(17, 17, 5, 5, { rx: 1 }),
    ],

    List: [
        lineToIconNode(8, 6, 21, 6),
        lineToIconNode(8, 12, 21, 12),
        lineToIconNode(8, 18, 21, 18),
        lineToIconNode(3, 6, 3.01, 6),
        lineToIconNode(3, 12, 3.01, 12),
        lineToIconNode(3, 18, 3.01, 18),
    ],

    Columns: [
        pathToIconNode('M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7m0-18H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7m0-18v18'),
    ],

    Rows: [
        pathToIconNode('M3 12h18M3 12v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7m-18 0V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7'),
    ],

    Sidebar: [
        rectToIconNode(3, 3, 18, 18, { rx: 2 }),
        lineToIconNode(9, 3, 9, 21),
    ],

    PanelLeft: [
        rectToIconNode(3, 3, 18, 18, { rx: 2 }),
        lineToIconNode(9, 3, 9, 21),
    ],

    PanelRight: [
        rectToIconNode(3, 3, 18, 18, { rx: 2 }),
        lineToIconNode(15, 3, 15, 21),
    ],

    // Devices
    Monitor: [
        rectToIconNode(2, 3, 20, 14, { rx: 2 }),
        lineToIconNode(8, 21, 16, 21),
        lineToIconNode(12, 17, 12, 21),
    ],

    Smartphone: [
        rectToIconNode(5, 2, 14, 20, { rx: 2 }),
        lineToIconNode(12, 18, 12.01, 18),
    ],

    Tablet: [
        rectToIconNode(4, 2, 16, 20, { rx: 2 }),
        lineToIconNode(12, 18, 12.01, 18),
    ],

    Laptop: [
        pathToIconNode('M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16'),
    ],

    Tv: [
        rectToIconNode(2, 7, 20, 13, { rx: 2 }),
        polylineToIconNode('17 2 12 7 7 2'),
    ],

    Watch: [
        circleToIconNode(12, 12, 6),
        polylineToIconNode('12 10 12 12 13 13'),
        pathToIconNode('m16.13 7.66-.81-4.05a2 2 0 0 0-2-1.61h-2.68a2 2 0 0 0-2 1.61l-.78 4.05m.02 8.7.8 4a2 2 0 0 0 2 1.61h2.72a2 2 0 0 0 2-1.61l.81-4.05'),
    ],

    // Finance & Business
    PieChart: [
        pathToIconNode('M21.21 15.89A10 10 0 1 1 8 2.83'),
        pathToIconNode('M22 12A10 10 0 0 0 12 2v10z'),
    ],

    BarChart: [
        lineToIconNode(12, 20, 12, 10),
        lineToIconNode(18, 20, 18, 4),
        lineToIconNode(6, 20, 6, 16),
    ],

    BarChart2: [
        lineToIconNode(18, 20, 18, 10),
        lineToIconNode(12, 20, 12, 4),
        lineToIconNode(6, 20, 6, 14),
    ],

    LineChart: [
        pathToIconNode('M3 3v18h18'),
        pathToIconNode('m19 9-5 5-4-4-3 3'),
    ],

    TrendingUp: [
        polylineToIconNode('23 6 13.5 15.5 8.5 10.5 1 18'),
        polylineToIconNode('17 6 23 6 23 12'),
    ],

    TrendingDown: [
        polylineToIconNode('23 18 13.5 8.5 8.5 13.5 1 6'),
        polylineToIconNode('17 18 23 18 23 12'),
    ],

    Activity: [
        polylineToIconNode('22 12 18 12 15 21 9 3 6 12 2 12'),
    ],

    Briefcase: [
        rectToIconNode(2, 7, 20, 14, { rx: 2 }),
        pathToIconNode('M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16'),
    ],

    // System & Hardware
    Database: [
        ellipseToIconNode(12, 5, 9, 3),
        pathToIconNode('M21 12c0 1.66-4 3-9 3s-9-1.34-9-3'),
        pathToIconNode('M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5'),
    ],

    Server: [
        rectToIconNode(2, 2, 20, 8, { rx: 2 }),
        rectToIconNode(2, 14, 20, 8, { rx: 2 }),
        lineToIconNode(6, 6, 6.01, 6),
        lineToIconNode(6, 18, 6.01, 18),
    ],

    HardDrive: [
        lineToIconNode(22, 12, 2, 12),
        pathToIconNode('M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'),
        lineToIconNode(6, 16, 6.01, 16),
        lineToIconNode(10, 16, 10.01, 16),
    ],

    Cpu: [
        rectToIconNode(4, 4, 16, 16, { rx: 2 }),
        rectToIconNode(9, 9, 6, 6),
        lineToIconNode(9, 1, 9, 4),
        lineToIconNode(15, 1, 15, 4),
        lineToIconNode(9, 20, 9, 23),
        lineToIconNode(15, 20, 15, 23),
        lineToIconNode(20, 9, 23, 9),
        lineToIconNode(20, 14, 23, 14),
        lineToIconNode(1, 9, 4, 9),
        lineToIconNode(1, 14, 4, 14),
    ],

    // Tools & Productivity
    Printer: [
        polylineToIconNode('6 9 6 2 18 2 18 9'),
        pathToIconNode('M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2'),
        rectToIconNode(6, 14, 12, 8),
    ],

    Camera: [
        pathToIconNode('M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z'),
        circleToIconNode(12, 13, 4),
    ],

    Scissors: [
        circleToIconNode(6, 6, 3),
        circleToIconNode(6, 18, 3),
        lineToIconNode(20, 4, 8.12, 15.88),
        lineToIconNode(14.47, 14.48, 20, 20),
        lineToIconNode(8.12, 8.12, 12, 12),
    ],

    Clipboard: [
        pathToIconNode('M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'),
        rectToIconNode(8, 2, 8, 4, { rx: 1 }),
    ],

    ClipboardCheck: [
        pathToIconNode('M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'),
        rectToIconNode(8, 2, 8, 4, { rx: 1 }),
        pathToIconNode('m9 14 2 2 4-4'),
    ],

    ClipboardList: [
        pathToIconNode('M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'),
        rectToIconNode(8, 2, 8, 4, { rx: 1 }),
        pathToIconNode('M12 11h4'),
        pathToIconNode('M12 16h4'),
        pathToIconNode('M8 11h.01'),
        pathToIconNode('M8 16h.01'),
    ],

    Archive: [
        polylineToIconNode('21 8 21 21 3 21 3 8'),
        rectToIconNode(1, 3, 22, 5),
        lineToIconNode(10, 12, 14, 12),
    ],

    BookOpen: [
        pathToIconNode('M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z'),
        pathToIconNode('M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z'),
    ],

    Book: [
        pathToIconNode('M4 19.5A2.5 2.5 0 0 1 6.5 17H20'),
        pathToIconNode('M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z'),
    ],

    // Location & Navigation
    Compass: [
        circleToIconNode(12, 12, 10),
        polygonToIconNode('16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76'),
    ],

    MapPin: [
        pathToIconNode('M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z'),
        circleToIconNode(12, 10, 3),
    ],

    Map: [
        polygonToIconNode('3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6'),
        lineToIconNode(9, 3, 9, 18),
        lineToIconNode(15, 6, 15, 21),
    ],

    Navigation: [
        polygonToIconNode('3 11 22 2 13 21 11 13 3 11'),
    ],

    Navigation2: [
        polygonToIconNode('12 2 19 21 12 17 5 21 12 2'),
    ],

    Locate: [
        lineToIconNode(2, 12, 5, 12),
        lineToIconNode(19, 12, 22, 12),
        lineToIconNode(12, 2, 12, 5),
        lineToIconNode(12, 19, 12, 22),
        circleToIconNode(12, 12, 7),
    ],

    LocateFixed: [
        lineToIconNode(2, 12, 5, 12),
        lineToIconNode(19, 12, 22, 12),
        lineToIconNode(12, 2, 12, 5),
        lineToIconNode(12, 19, 12, 22),
        circleToIconNode(12, 12, 7),
        circleToIconNode(12, 12, 3),
    ],

    Globe: [
        circleToIconNode(12, 12, 10),
        lineToIconNode(2, 12, 22, 12),
        pathToIconNode('M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'),
    ],

    // Connectivity
    Wifi: [
        pathToIconNode('M5 12.55a11 11 0 0 1 14.08 0'),
        pathToIconNode('M1.42 9a16 16 0 0 1 21.16 0'),
        pathToIconNode('M8.53 16.11a6 6 0 0 1 6.95 0'),
        lineToIconNode(12, 20, 12.01, 20),
    ],

    WifiOff: [
        lineToIconNode(1, 1, 23, 23),
        pathToIconNode('M16.72 11.06A10.94 10.94 0 0 1 19 12.55'),
        pathToIconNode('M5 12.55a10.94 10.94 0 0 1 5.17-2.39'),
        pathToIconNode('M10.71 5.05A16 16 0 0 1 22.58 9'),
        pathToIconNode('M1.42 9a15.91 15.91 0 0 1 4.7-2.88'),
        pathToIconNode('M8.53 16.11a6 6 0 0 1 6.95 0'),
        lineToIconNode(12, 20, 12.01, 20),
    ],

    Bluetooth: [
        polylineToIconNode('6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5'),
    ],

    BluetoothConnected: [
        pathToIconNode('m7 7 10 10-5 5V2l5 5L7 17'),
        lineToIconNode(18, 12, 21, 12),
        lineToIconNode(3, 12, 6, 12),
    ],

    // Battery


    // Battery
    Battery: [
        rectToIconNode(2, 7, 16, 10, { rx: 2 }),
        lineToIconNode(22, 11, 22, 13),
    ],

    BatteryFull: [
        rectToIconNode(2, 7, 16, 10, { rx: 2 }),
        lineToIconNode(22, 11, 22, 13),
        rectToIconNode(4, 9, 3, 6, { fill: 'currentColor' }),
        rectToIconNode(8, 9, 3, 6, { fill: 'currentColor' }),
        rectToIconNode(12, 9, 3, 6, { fill: 'currentColor' }),
    ],

    BatteryMedium: [
        rectToIconNode(2, 7, 16, 10, { rx: 2 }),
        lineToIconNode(22, 11, 22, 13),
        rectToIconNode(4, 9, 3, 6, { fill: 'currentColor' }),
        rectToIconNode(8, 9, 3, 6, { fill: 'currentColor' }),
    ],

    BatteryLow: [
        rectToIconNode(2, 7, 16, 10, { rx: 2 }),
        lineToIconNode(22, 11, 22, 13),
        rectToIconNode(4, 9, 3, 6, { fill: 'currentColor' }),
    ],

    BatteryCharging: [
        rectToIconNode(2, 7, 16, 10, { rx: 2 }),
        lineToIconNode(22, 11, 22, 13),
        pathToIconNode('m11 7-3 5h4l-3 5'),
    ],

    // Audio
    Headphones: [
        pathToIconNode('M3 18v-6a9 9 0 0 1 18 0v6'),
        pathToIconNode('M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z'),
    ],

    Mic: [
        pathToIconNode('M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z'),
        pathToIconNode('M19 10v2a7 7 0 0 1-14 0v-2'),
        lineToIconNode(12, 19, 12, 22),
    ],

    MicOff: [
        lineToIconNode(1, 1, 23, 23),
        pathToIconNode('M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6'),
        pathToIconNode('M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23'),
        lineToIconNode(12, 19, 12, 22),
    ],

    Radio: [
        circleToIconNode(12, 12, 2),
        pathToIconNode('M4.93 19.07a10 10 0 0 1 0-14.14'),
        pathToIconNode('M19.07 19.07a10 10 0 0 0 0-14.14'),
        pathToIconNode('M8.46 15.54a5 5 0 0 1 0-7.07'),
        pathToIconNode('M15.54 15.54a5 5 0 0 0 0-7.07'),
    ],

    Speaker: [
        rectToIconNode(4, 2, 16, 20, { rx: 2 }),
        circleToIconNode(12, 14, 4),
        lineToIconNode(12, 6, 12.01, 6),
    ],

    // Social & Brands
    Facebook: [
        pathToIconNode('M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z'),
    ],

    Twitter: [
        pathToIconNode('M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z'),
    ],

    Instagram: [
        rectToIconNode(2, 2, 20, 20, { rx: 5 }),
        pathToIconNode('M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z'),
        lineToIconNode(17.5, 6.5, 17.51, 6.5),
    ],

    Linkedin: [
        pathToIconNode('M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z'),
        rectToIconNode(2, 9, 4, 12),
        circleToIconNode(4, 4, 2),
    ],

    Youtube: [
        pathToIconNode('M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z'),
        polygonToIconNode('9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02'),
    ],

    // Shapes & Symbols
    Circle: [
        circleToIconNode(12, 12, 10),
    ],

    Triangle: [
        pathToIconNode('M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'),
    ],

    Hexagon: [
        pathToIconNode('M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z'),
    ],

    Octagon: [
        polygonToIconNode('7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2'),
    ],

    // Interface & Tools
    Filter: [
        polygonToIconNode('22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3'),
    ],

    Sliders: [
        lineToIconNode(4, 21, 4, 14),
        lineToIconNode(4, 10, 4, 3),
        lineToIconNode(12, 21, 12, 12),
        lineToIconNode(12, 8, 12, 3),
        lineToIconNode(20, 21, 20, 16),
        lineToIconNode(20, 12, 20, 3),
        lineToIconNode(1, 14, 7, 14),
        lineToIconNode(9, 8, 15, 8),
        lineToIconNode(17, 16, 23, 16),
    ],

    Layers: [
        polygonToIconNode('12 2 2 7 12 12 22 7 12 2'),
        polylineToIconNode('2 17 12 22 22 17'),
        polylineToIconNode('2 12 12 17 22 12'),
    ],

    ZoomIn: [
        circleToIconNode(11, 11, 8),
        pathToIconNode('m21 21-4.35-4.35'),
        lineToIconNode(11, 8, 11, 14),
        lineToIconNode(8, 11, 14, 11),
    ],

    ZoomOut: [
        circleToIconNode(11, 11, 8),
        pathToIconNode('m21 21-4.35-4.35'),
        lineToIconNode(8, 11, 14, 11),
    ],

    Maximize: [
        pathToIconNode('M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3'),
    ],

    Maximize2: [
        polylineToIconNode('15 3 21 3 21 9'),
        polylineToIconNode('9 21 3 21 3 15'),
        lineToIconNode(21, 3, 14, 10),
        lineToIconNode(3, 21, 10, 14),
    ],

    Minimize: [
        pathToIconNode('M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3'),
    ],

    Minimize2: [
        polylineToIconNode('4 14 10 14 10 20'),
        polylineToIconNode('20 10 14 10 14 4'),
        lineToIconNode(14, 10, 21, 3),
        lineToIconNode(3, 21, 10, 14),
    ],

    Move: [
        polylineToIconNode('5 9 2 12 5 15'),
        polylineToIconNode('9 5 12 2 15 5'),
        polylineToIconNode('15 19 12 22 9 19'),
        polylineToIconNode('19 9 22 12 19 15'),
        lineToIconNode(2, 12, 22, 12),
        lineToIconNode(12, 2, 12, 22),
    ],

    // Additional Useful Icons
    Crosshair: [
        circleToIconNode(12, 12, 10),
        lineToIconNode(22, 12, 18, 12),
        lineToIconNode(6, 12, 2, 12),
        lineToIconNode(12, 6, 12, 2),
        lineToIconNode(12, 18, 12, 22),
    ],

    Aperture: [
        circleToIconNode(12, 12, 10),
        lineToIconNode(14.31, 8, 20.05, 17.94),
        lineToIconNode(9.69, 8, 21.17, 8),
        lineToIconNode(7.38, 12, 13.12, 2.06),
        lineToIconNode(9.69, 16, 3.95, 6.06),
        lineToIconNode(14.31, 16, 2.83, 16),
        lineToIconNode(16.62, 12, 10.88, 21.94),
    ],

    Target: [
        circleToIconNode(12, 12, 10),
        circleToIconNode(12, 12, 6),
        circleToIconNode(12, 12, 2),
    ],

    Award: [
        circleToIconNode(12, 8, 7),
        polylineToIconNode('8.21 13.89 7 23 12 20 17 23 15.79 13.88'),
    ],

    Feather: [
        pathToIconNode('M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z'),
        lineToIconNode(16, 8, 2, 22),
        lineToIconNode(17.5, 15, 9, 15),
    ],

    Droplet: [
        pathToIconNode('M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z'),
    ],

    Thermometer: [
        pathToIconNode('M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z'),
    ],

    Umbrella: [
        pathToIconNode('M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7'),
    ],

    Anchor: [
        circleToIconNode(12, 5, 3),
        lineToIconNode(12, 22, 12, 8),
        pathToIconNode('M5 12H2a10 10 0 0 0 20 0h-3'),
    ],
};

/**
 * Create all icons
 */
const Icons = createIcons(iconDefinitions);
export default Icons

/**
 * Export individual icons for tree-shaking
 */
export const {
    Home,
    Menu,
    X,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    ChevronsDown,
    ChevronsUp,
    ChevronsLeft,
    ChevronsRight,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    ArrowDown,
    ArrowUpRight,
    ArrowDownRight,
    ArrowUpLeft,
    ArrowDownLeft,
    Plus,
    Minus,
    Check,
    Search,
    Settings,
    MoreVertical,
    MoreHorizontal,
    Edit,
    Edit2,
    Edit3,
    Trash,
    Trash2,
    Copy,
    Download,
    Upload,
    Save,
    Refresh,
    RefreshCw,
    RotateCw,
    RotateCcw,
    File,
    FileText,
    FilePlus,
    FileMinus,
    FileCode,
    FileSearch,
    FileLock,
    Folder,
    FolderOpen,
    FolderPlus,
    FolderMinus,
    FolderSearch,
    FolderLock,
    FolderHeart,
    Mail,
    MessageSquare,
    MessageCircle,
    Send,
    Bell,
    BellOff,
    BellRing,
    Inbox,
    AtSign,
    Phone,
    PhoneCall,
    PhoneOff,
    Image,
    Video,
    Music,
    Play,
    Pause,
    Square,
    SkipBack,
    SkipForward,
    FastForward,
    Rewind,
    Volume,
    Volume1,
    Volume2,
    VolumeX,
    User,
    Users,
    UserPlus,
    UserMinus,
    UserCheck,
    UserX,
    UserSearch,
    Heart,
    Star,
    AlertCircle,
    AlertTriangle,
    Info,
    CheckCircle,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Clock,
    Calendar,
    Timer,
    History,
    Lock,
    Unlock,
    Eye,
    EyeOff,
    Shield,
    ShieldCheck,
    ShieldAlert,
    ShieldOff,
    Key,
    ShoppingCart,
    ShoppingBag,
    CreditCard,
    DollarSign,
    Tag,
    Gift,
    Package,
    Code,
    Code2,
    Terminal,
    Command,
    GitBranch,
    GitCommit,
    GitMerge,
    GitPullRequest,
    Github,
    Sun,
    Moon,
    Cloud,
    CloudRain,
    CloudSnow,
    CloudLightning,
    Zap,
    Bookmark,
    Flag,
    Share,
    Share2,
    Link,
    Link2,
    ExternalLink,
    Loader,
    Loader2,
    Layout,
    Grid,
    Grid3x3,
    List,
    Columns,
    Rows,
    Sidebar,
    PanelLeft,
    PanelRight,
    Monitor,
    Smartphone,
    Tablet,
    Laptop,
    Tv,
    Watch,
    PieChart,
    BarChart,
    BarChart2,
    LineChart,
    TrendingUp,
    TrendingDown,
    Activity,
    Briefcase,
    Database,
    Server,
    HardDrive,
    Cpu,
    Printer,
    Camera,
    Scissors,
    Clipboard,
    ClipboardCheck,
    ClipboardList,
    Archive,
    BookOpen,
    Book,
    Compass,
    MapPin,
    Map,
    Navigation,
    Navigation2,
    Locate,
    LocateFixed,
    Globe,
    Wifi,
    WifiOff,
    Bluetooth,
    BluetoothConnected,
    Battery,
    BatteryFull,
    BatteryMedium,
    BatteryLow,
    BatteryCharging,
    Headphones,
    Mic,
    MicOff,
    Radio,
    Speaker,
    Facebook,
    Twitter,
    Instagram,
    Linkedin,
    Youtube,
    Slack,
    Circle,
    Triangle,
    Hexagon,
    Octagon,
    Filter,
    Sliders,
    Layers,
    ZoomIn,
    ZoomOut,
    Maximize,
    Maximize2,
    Minimize,
    Minimize2,
    Move,
    Crosshair,
    Aperture,
    Target,
    Award,
    Feather,
    Droplet,
    Thermometer,
    Umbrella,
    Anchor,
} = Icons;
