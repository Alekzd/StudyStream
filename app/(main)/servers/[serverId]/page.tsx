// app/(main)/servers/[serverId]/page.tsx
// StudyStream OS — Server landing page (when no room selected)

export default function ServerPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center gap-4">
      <p className="text-5xl">📹</p>
      <h2 className="text-xl font-semibold text-neutral-300">
        Chọn một phòng học để bắt đầu!
      </h2>
      <p className="text-neutral-500 text-sm max-w-sm">
        Chọn phòng học từ danh sách bên trái để tham gia cùng với các bạn.
        <br />
        Hãy bật camera để kích hoạt trải nghiệm Body Doubling.
      </p>
    </div>
  );
}
