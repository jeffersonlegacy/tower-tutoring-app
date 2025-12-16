import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

export default function VideoChat({ sessionId }) {
    const appId = import.meta.env.VITE_JITSI_APP_ID;
    // Sample JWT provided by user. In production, fetch this from your backend.
    const jwt = "eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtZDE4MTFhYzZhNmI4NDIzOTk1YTBmYjU3OGQxMjJiZmQvOWMzMTRhLVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NjU3OTQ0NTQsImV4cCI6MTc2NTgwMTY1NCwibmJmIjoxNzY1Nzk0NDQ5LCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtZDE4MTFhYzZhNmI4NDIzOTk1YTBmYjU3OGQxMjJiZmQiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOnRydWUsImZpbGUtdXBsb2FkIjp0cnVlLCJvdXRib3VuZC1jYWxsIjp0cnVlLCJzaXAtb3V0Ym91bmQtY2FsbCI6ZmFsc2UsInRyYW5zY3JpcHRpb24iOnRydWUsImxpc3QtdmlzaXRvcnMiOmZhbHNlLCJyZWNvcmRpbmciOnRydWUsImZsaXAiOmZhbHNlfSwidXNlciI6eyJoaWRkZW4tZnJvbS1yZWNvcmRlciI6ZmFsc2UsIm1vZGVyYXRvciI6dHJ1ZSwibmFtZSI6Im1pa2V0b3dlcmplZmZlcnNvbiIsImlkIjoiZ29vZ2xlLW9hdXRoMnwxMDg3MjczNTIyMDAzNjA4ODQ0NzUiLCJhdmF0YXIiOiIiLCJlbWFpbCI6Im1pa2V0b3dlcmplZmZlcnNvbkBnbWFpbC5jb20ifX0sInJvb20iOiIqIn0.WnnvNmCRy7zyG-v4QSpIxD546H2-gs5iSzPTxUrTTfy_bQsk-T8A4Q0PzbiqqVoVgyLnWbSXu_CsIvHVEe0b14PHRCGZZ_6xI6Ffmg9nBIuHtzePpctiLSSOx5zW68NhH9kpyqSOxMyBvC_VCum9ioW-Oi9dPf5nhoc63qOGQv4Yo28Z4_SOQdnuksVClcah6xxVsZmOYJK_c14QP4BVOB5uwvy2zigsqfsLEM0W8aBuE9WrovkuXEma_DI6sDTb5bT5HFcgffJVAFbwvI1bT_wU-XxY7HhOlsmwAdk07frHLc8gGLgv8OoYeAyxBbmoQfHZu4wSknUTeRPQenK2Ew";

    return (
        <div className="h-full w-full bg-black">
            <JitsiMeeting
                domain="8x8.vc"
                roomName={`${appId}/${sessionId}`}
                jwt={jwt}
                configOverwrite={{
                    startWithAudioMuted: true,
                    disableThirdPartyRequests: true,
                    prejoinPageEnabled: false,
                }}
                interfaceConfigOverwrite={{
                    tileViewEnabled: true,
                }}
                spinner={() => (
                    <div className="flex items-center justify-center h-full text-white">Loading Video...</div>
                )}
                getIFrameRef={(iframeRef) => {
                    iframeRef.style.height = '100%';
                }}
            />
        </div>
    );
}
