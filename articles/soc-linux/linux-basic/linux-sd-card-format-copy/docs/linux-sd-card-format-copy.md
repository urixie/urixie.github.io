# Linux SD 卡格式化与文件复制：设备识别、FAT32 与完整性校验

记录通过 SSH 识别 SD 卡、格式化 FAT32、复制目录全部内容，并通过文件系统检查、SHA-256 和目录清单验证结果的完整流程。

整理日期：2026 年 10 月 19 日。本文基于一次嵌入式 Linux 设备的实际操作整理，内网地址、密码、主机指纹、SD 卡 CID 和个人工作目录已从公开版本中移除。

## 1. 任务与最终结果

本次任务是登录 Linux 设备，格式化 SD 卡，再将 `/root/cd/` 中的全部内容复制到卡根目录。需要复制的是目录里的内容，因此卡中应直接出现 `private/` 和两个说明文件，而不是先出现一层 `cd/`。

| 项目 | 结果 |
| --- | --- |
| 目标设备与分区 | SD 卡 `/dev/mmcblk1`，分区 `/dev/mmcblk1p1` |
| 原始容量 | 8,053,063,680 字节，工具显示约 7.5G |
| 格式化结果 | FAT32，卷标 `TF_CARD` |
| 源数据规模 | 约 2.7 MB，11 个普通文件，5 个子目录 |
| 复制结果 | 文件、中文文件名和空目录均已复制 |
| 完整性校验 | 11 个文件 SHA-256 全部通过，文件与目录清单一致 |
| 源文件复核 | 操作前后源文件 SHA-256 一致 |
| 文件系统检查 | `fsck.vfat -n` 通过 |
| 最终状态 | 完成同步并卸载，无挂载点 |

> 格式化会清除目标分区原有内容。本文记录的设备名称仅适用于本次设备；用于其他机器前，必须重新识别目标磁盘、分区和源数据位置。本次保留了原分区表，没有执行整卡安全擦除。

## 2. 先区分系统盘与 SD 卡

### 2.1 读取块设备和挂载信息

实际操作从只读检查开始：

```bash
uname -a
lsblk -o NAME,PATH,SIZE,TYPE,FSTYPE,LABEL,UUID,MOUNTPOINTS,MODEL,TRAN,RM
findmnt
ls -la /root/cd/
du -sh /root/cd/
```

这台设备的系统为 Linux 5.10.160、aarch64。系统盘是约 29.1G 的 `/dev/mmcblk0`，根分区 `/dev/mmcblk0p6` 使用 ext4；另一张卡是约 7.5G 的 `/dev/mmcblk1`，只有一个 FAT 分区 `/dev/mmcblk1p1`，卷标为 `TF_CARD`。

本次 `lsblk` 输出中，SD 卡的 `RM` 也为 0。因此，没有只凭“可移动设备”标志或 `mmcblk` 序号决定格式化对象，而是继续核对硬件类型、容量和系统挂载来源。

### 2.2 通过 sysfs 核实硬件类型

```bash
cat /sys/block/mmcblk0/device/type
cat /sys/block/mmcblk1/device/type
cat /sys/block/mmcblk1/device/name
cat /sys/block/mmcblk1/device/cid
blockdev --getsize64 /dev/mmcblk1
findmnt -T /root/cd -o SOURCE,TARGET,FSTYPE
```

实际结果为：`mmcblk0` 的类型是 `MMC`，`mmcblk1` 的类型是 `SD`，SD 卡容量为 8,053,063,680 字节；源目录所在分区为 `/dev/mmcblk0p6`。卡片 CID 已在执行前记录，脚本在格式化前再次比对，以确认操作对象没有变化。

这些 sysfs 路径对应本次通过 MMC 子系统接入的卡。通过 USB 读卡器连接的卡可能显示为其他设备名，需要按其实际硬件路径重新核实。

### 2.3 确认没有挂载或被其他块设备持有

```bash
lsblk -o NAME,PTTYPE,PARTTYPE,SIZE,FSTYPE /dev/mmcblk1
ls -la /mnt/sdcard
ls -l /sys/class/block/mmcblk1/holders /sys/class/block/mmcblk1p1/holders
cat /etc/fstab
```

本次目标分区未挂载，`/mnt/sdcard` 已存在且为空，holders 目录为空。现有分区表为 DOS/MBR，分区类型为 `0xc`，因此直接格式化已有分区，保留分区布局。

## 3. 检查源目录与 FAT32 兼容性

正式格式化前，确认工具可用，并检查源数据类型和数量：

```bash
command -v mkfs.vfat
command -v fsck.vfat
command -v sha256sum
command -v mount
command -v umount

find /root/cd -type l -print
find /root/cd -type f -size +4095M -print
find /root/cd -mindepth 1 ! -type d ! -type f -print
find /root/cd -type f | wc -l
find /root/cd -type d | wc -l
find /root/cd -type f -printf "%P\n"
```

本次得到 11 个普通文件和 6 个目录，目录数包含源目录本身。没有发现符号链接、其他特殊文件或大于 4095 MiB 的文件。两个说明文件原本均为 0 字节，`private/sounds/` 和 `private/videos/` 是空目录。

源卡原本使用 FAT 文件系统，因此沿用 FAT32。本次验证关注文件内容、名称及目录结构，不将 Linux 的权限、所有权和时间戳作为复制一致性指标。

## 4. 格式化、挂载与复制

### 4.1 格式化目标分区

```bash
mkfs.vfat -F 32 -n TF_CARD /dev/mmcblk1p1
```

这里的目标是已有分区 `/dev/mmcblk1p1`。参数 `-F 32` 指定 FAT32，`-n TF_CARD` 设置卷标。本次工具输出版本为 `mkfs.fat 4.2 (2021-01-31)`。

### 4.2 挂载后复制目录内容

```bash
mount -t vfat -o iocharset=utf8 /dev/mmcblk1p1 /mnt/sdcard
cp -r /root/cd/. /mnt/sdcard/
sync
df -h /mnt/sdcard
umount /mnt/sdcard
```

`/root/cd/.` 表示复制该目录内部的全部内容，包含隐藏项；同时保留子目录和空目录。没有使用 `/root/cd/*`，避免遗漏隐藏项。挂载选项显式使用 UTF-8，以处理本次存在的中文文件名。

复制后，`df -h` 显示目标分区容量约 7.5G，占用约 2.7M。脚本先同步并卸载，再进行文件系统检查和只读重挂载校验。

## 5. 分三层校验复制结果

### 5.1 检查 FAT 文件系统

```bash
fsck.vfat -n /dev/mmcblk1p1
```

检查在未挂载状态下进行。`-n` 用于检查而不执行修复。本次输出为：

```text
fsck.fat 4.2 (2021-01-31)
/dev/mmcblk1p1: 17 files, 681/1962238 clusters
```

这里的“17 files”是工具报告的文件系统条目计数，不等同于 `find -type f` 得到的普通文件数。实际普通文件为 11 个。

### 5.2 重新只读挂载并逐文件校验

在格式化前，脚本已经为源文件生成 SHA-256 清单。写入并卸载后，再只读挂载目标分区，检查从卡上读出的每个文件：

```bash
mount -t vfat -o ro,iocharset=utf8 /dev/mmcblk1p1 /mnt/sdcard
cd /mnt/sdcard
sha256sum -c /tmp/sd-card-copy.cZ0pLs/source.sha256
```

`/tmp/sd-card-copy.cZ0pLs/` 是本次通过 `mktemp` 创建的实际审计目录；其他运行会生成不同的路径。11 个文件全部返回 `OK`，包括两个 0 字节说明文件。

### 5.3 比较目录结构并复查源文件

仅校验已有文件的摘要还不足以覆盖空目录或额外条目，因此同时比较两侧的文件类型和相对路径：

```bash
diff -u "$audit/source-tree.txt" "$audit/destination-tree.txt"
diff -u "$audit/source.sha256" "$audit/source-after.sha256"
```

第一项比较源与目标的文件/目录清单，覆盖空目录和额外条目；第二项比较操作前后的源文件摘要，确认源文件内容在复制期间没有变化。两次比较都无差异，脚本最终退出码为 0。

## 6. 完整执行脚本的公开版

以下为实际 Bash 脚本的脱敏版：卡片 CID 改为需要手动填写的变量，并增加占位值检查，避免直接运行未配置的示例。其余主体流程保留了本次设备的实际配置。

脚本假定源目录为 `/root/cd`、系统根分区为 `/dev/mmcblk0p6`、SD 卡容量为 8,053,063,680 字节、目标分区未挂载且挂载点已存在。迁移到其他环境时必须逐项调整并重新核实。脚本中任一步骤失败都会中止后续流程；失败后应检查当前挂载状态，不应直接从头重复格式化。

```bash
#!/bin/bash
set -euo pipefail
export LC_ALL=C.UTF-8

src=/root/cd
dst=/mnt/sdcard
dev=/dev/mmcblk1p1
disk=/dev/mmcblk1

# Replace this value with the CID confirmed during read-only inspection.
expected_cid='REPLACE_WITH_VERIFIED_SD_CID'
test "$expected_cid" != REPLACE_WITH_VERIFIED_SD_CID

# Recheck the physical card and protect the system disk.
test "$(cat /sys/block/mmcblk1/device/type)" = SD
test "$(cat /sys/block/mmcblk1/device/cid)" = "$expected_cid"
test "$(blockdev --getsize64 "$disk")" = 8053063680
test "$(findmnt -n -o SOURCE /)" = /dev/mmcblk0p6
test "$(findmnt -n -o SOURCE -T "$src")" = /dev/mmcblk0p6
test -b "$dev"
test -d "$src"
test -d "$dst"
test -z "$(find "$dst" -mindepth 1 -maxdepth 1 -print -quit)"
if lsblk -nr -o MOUNTPOINTS "$disk" | grep -q '[^[:space:]]'; then
    echo "STOP: SD card has a mounted filesystem." >&2
    exit 1
fi
test -z "$(ls -A /sys/class/block/mmcblk1/holders)"
test -z "$(ls -A /sys/class/block/mmcblk1p1/holders)"

audit=$(mktemp -d /tmp/sd-card-copy.XXXXXX)
echo "Audit directory: $audit"
(
    cd "$src"
    find . -type f -exec sha256sum {} + | sort
) > "$audit/source.sha256"
(
    cd "$src"
    find . -printf '%y %P\n' | sort
) > "$audit/source-tree.txt"

echo 'Formatting SD partition as FAT32...'
mkfs.vfat -F 32 -n TF_CARD "$dev"
mount -t vfat -o iocharset=utf8 "$dev" "$dst"
test "$(findmnt -n -o SOURCE --target "$dst")" = "$dev"

echo 'Copying all source contents, including hidden entries...'
cp -r "$src"/. "$dst"/
sync
df -h "$dst"
umount "$dst"

echo 'Checking FAT32 filesystem after writing...'
fsck.vfat -n "$dev"

echo 'Remounting read-only and verifying stored data...'
mount -t vfat -o ro,iocharset=utf8 "$dev" "$dst"
(
    cd "$dst"
    sha256sum -c "$audit/source.sha256"
)
(
    cd "$dst"
    find . -printf '%y %P\n' | sort
) > "$audit/destination-tree.txt"
diff -u "$audit/source-tree.txt" "$audit/destination-tree.txt"
(
    cd "$src"
    find . -type f -exec sha256sum {} + | sort
) > "$audit/source-after.sha256"
diff -u "$audit/source.sha256" "$audit/source-after.sha256"
printf 'Verified files: '
find "$dst" -type f | wc -l
printf 'Verified directories including root: '
find "$dst" -type d | wc -l
ls -la "$dst"
sync
umount "$dst"
lsblk -o NAME,SIZE,FSTYPE,LABEL,UUID,MOUNTPOINTS "$disk"
echo 'SUCCESS: format, copy, filesystem check, SHA-256 verification, and unmount completed.'
```

## 7. 实际校验输出与目录结构

本次校验的关键输出：

```text
./private/bin/pinyin.bin: OK
./private/bin/system.bin: OK
./private/truefont/truefont.ini: OK
./private/main.lua: OK
./private/bin/font.idx: OK
./private/bin/image.bin: OK
./private/bin/image.idx: OK
./private/bin/screen.bin: OK
./!!!Copy [private] directory to the root directory of  SD Card.txt: OK
./!!!直接复制private文件夹到SD卡根目录.txt: OK
./private/truefont/wqymicrohei.ttf: OK
Verified files: 11
Verified directories including root: 6
SUCCESS: format, copy, filesystem check, SHA-256 verification, and unmount completed.
```

SD 卡根目录的最终内容：

```text
SD_CARD_ROOT/
├── !!!Copy [private] directory to the root directory of  SD Card.txt
├── !!!直接复制private文件夹到SD卡根目录.txt
└── private/
    ├── main.lua
    ├── bin/
    │   ├── font.idx
    │   ├── image.bin
    │   ├── image.idx
    │   ├── pinyin.bin
    │   ├── screen.bin
    │   └── system.bin
    ├── sounds/
    ├── truefont/
    │   ├── truefont.ini
    │   └── wqymicrohei.ttf
    └── videos/
```

最后执行 `sync`、`umount /mnt/sdcard`，再用 `lsblk` 确认目标分区没有挂载点。最终显示文件系统为 `vfat`、卷标为 `TF_CARD`，卡可以取出。

## 8. 执行中遇到的问题

| 问题 | 实际处理 |
| --- | --- |
| 本地 Python 没有安装 Paramiko | 使用已安装的 PuTTY Plink，通过 SSH 执行服务器端 Bash |
| 初次批处理 SSH 没有缓存主机密钥 | 读取主机指纹，后续通过 Plink 的 hostkey 参数固定；本次没有另行进行独立渠道核验 |
| 受限执行环境阻止首次网络连接 | 使用执行环境提供的网络权限流程继续 |
| 服务器未安装 fdisk | 使用 lsblk、sysfs、blockdev 和 findmnt 完成设备核对 |
| 服务器的 lsblk 不支持 START 列 | 移除不支持的列，继续使用可用列检查 |

这些问题均发生在正式格式化之前。最终脚本执行成功，没有遗留未完成的复制或校验步骤。

## 9. 复用流程时保留的检查点

- 先通过挂载来源、硬件类型、容量和卡片标识识别设备，再指定格式化分区。
- 源数据与目标分区必须分离；本次源数据位于系统盘，格式化对象是独立 SD 卡分区。
- 复制目录内容时使用 `源目录/.`，同时覆盖隐藏项和空目录。
- 写入后先同步和卸载，再检查文件系统，并通过只读重挂载进行文件校验。
- 逐文件摘要与目录清单分别验证内容和结构；操作前后源文件摘要用于检查源内容变化。
- 最后确认已卸载。临时审计目录可能被系统清理，需要长期保存的清单应另行归档。

本篇公开版保留操作方法、完整命令和实际验证结果；原始私有操作记录另行保存在设备与本地工作目录，登录凭据和硬件唯一标识不随文章发布。

## 10. 下载本文 Markdown

[下载脱敏后的 Markdown 文档](docs/linux-sd-card-format-copy.md)

下载文件与本页正文使用同一份 Markdown 来源，便于离线查阅和后续维护。
